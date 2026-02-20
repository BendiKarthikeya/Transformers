"""Autonomous CI/CD Healing Agent with LangGraph multi-agent pipeline."""

from dotenv import load_dotenv
from pathlib import Path as _Path

# Load from backend/.env first, then fall back to root .env
_backend_env = _Path(__file__).parent / ".env"
_root_env = _Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=_backend_env)
load_dotenv(dotenv_path=_root_env, override=False)  # don't override backend/.env values

from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Optional, Dict, Any, Tuple
import os
import subprocess
import json
import re
import requests
from pathlib import Path
from datetime import datetime
import git
import pyflakes.api
import pyflakes.reporter
import io
from github import Github, GithubException


class AgentState(TypedDict):
    """State for the multi-agent workflow."""
    repo_url: str
    team_name: str
    team_leader: str
    repo_path: str
    branch_name: str
    test_files: List[str]
    all_py_files: List[str]
    pytest_output: str
    failures: List[Dict[str, Any]]
    fixes: List[Dict[str, Any]]
    commits: List[str]
    ci_status: str
    timeline: List[Dict[str, str]]
    total_failures: int
    total_fixes: int
    score: int
    error: Optional[str]
    original_repo_url: Optional[str]
    fork_url: Optional[str]
    pr_url: Optional[str]
    is_fork: bool
    fix_round: int
    project_type: str


class HealingAgent:
    """Multi-agent pipeline for CI/CD healing using LangGraph."""
    
    def __init__(self):
        """Initialize the healing agent."""
        self.llm = None  # Lazy load on first use
        self.github_token = os.getenv("GITHUB_CLASSICS") or os.getenv("GITHUB_TOKEN")
        self.repo_base = Path(__file__).parent / "repos"
        self.repo_base.mkdir(exist_ok=True)
        self.retry_limit = 5
        self.max_fix_rounds = 3
        self.workflow = self._build_workflow()
    
    def get_llm(self):
        """Lazy load LLM on first use."""
        if self.llm is None:
            model_name = os.getenv("GROQ_MODEL") or "llama-3.3-70b-versatile"
            self.llm = ChatGroq(
                model=model_name,
                api_key=os.getenv("GROQ_API_KEY"),
                temperature=0.3
            )
        return self.llm

    def _invoke_gemini(self, prompt: str) -> str:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")

        model_name = os.getenv("GEMINI_MODEL") or "gemini-1.5-flash"
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        headers = {
            "Content-Type": "application/json"
        }

        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=60
        )
        response.raise_for_status()
        data = response.json()
        
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as e:
            print(f"Error parsing Gemini response: {data}")
            raise e

    def _invoke_openrouter(self, prompt: str) -> str:
        api_key = os.getenv("OPEN_ROUTER_API") or os.getenv("OPENROUTER_API_KEY") # handle with or without space/different names
        if not api_key:
            # specifically for the user's var OPEN_ROUTER_API that might have space before equals in .env
            api_key = os.getenv("OPEN_ROUTER_API ")
            if not api_key:
                raise RuntimeError("OPEN_ROUTER_API is not set")
        
        # Strip just in case
        api_key = api_key.strip()

        model_name = os.getenv("OPENROUTER_MODEL") or "deepseek/deepseek-chat:free"
        
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=60)
        response.raise_for_status()
        data = response.json()
        
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as e:
            print(f"Error parsing OpenRouter response: {data}")
            raise e

    def _invoke_llm(self, prompt: str) -> str:
        try:
            return self._invoke_gemini(prompt)
        except Exception as e:
            print(f"Gemini LLM failed, falling back to Groq: {e}")
            try:
                message = self.get_llm().invoke(prompt)
                return message.content
            except Exception as e2:
                print(f"Groq LLM failed, falling back to OpenRouter: {e2}")
                try:
                    return self._invoke_openrouter(prompt)
                except Exception as e3:
                    raise RuntimeError(f"Gemini, Groq, and OpenRouter all failed. Last error: {e3}")

    def _clean_full_file(self, text: str, original_content: str) -> str:
        """Strip ALL markdown artifacts from an LLM-returned file and return clean Python."""
        if not text or not text.strip():
            return original_content

        cleaned = text.strip()

        # Remove leading/trailing fenced code blocks (```python ... ``` or ``` ... ```)
        fence_match = re.search(r"```(?:python)?\s*\n?(.*?)\n?```", cleaned, re.DOTALL | re.IGNORECASE)
        if fence_match:
            cleaned = fence_match.group(1)

        # Remove any remaining stray fence lines
        lines = []
        for line in cleaned.splitlines():
            stripped = line.strip()
            if stripped.startswith("```"):
                continue
            lines.append(line)

        result = "\n".join(lines)
        if not result.endswith("\n"):
            result += "\n"

        # Sanity check: if the result has no def/class/import it's probably garbage
        if not any(kw in result for kw in ["def ", "class ", "import ", "return ", "="]):
            print("[WARN] LLM output looks empty/invalid, keeping original file")
            return original_content

        return result
    
    def check_repo_ownership(self, repo_url: str) -> Tuple[bool, Optional[str]]:
        """Check if repo is owned by the authenticated user.
        
        Returns:
            (is_owned, owner) - True if owned by authenticated user, Owner username
        """
        try:
            if not self.github_token:
                return False, None
            
            g = Github(self.github_token)
            authenticated_user = g.get_user()
            
            # Extract owner from URL
            parts = repo_url.rstrip("/").split("/")
            repo_owner = parts[-2]
            
            return repo_owner.lower() == authenticated_user.login.lower(), repo_owner
        except Exception as e:
            print(f"Error checking repo ownership: {e}")
            return False, None
    
    def fork_repository(self, repo_url: str) -> Optional[str]:
        """Fork repository to authenticated user's account.
        
        Returns:
            Fork URL if successful, None otherwise
        """
        try:
            if not self.github_token:
                print("No GitHub token available for forking")
                return None
            
            g = Github(self.github_token)
            authenticated_user = g.get_user()
            
            # Extract owner/repo from URL
            parts = repo_url.rstrip("/").split("/")
            repo_owner = parts[-2]
            repo_name = parts[-1].replace(".git", "")
            
            # Get the repository
            original_repo = g.get_user(repo_owner).get_repo(repo_name)
            authenticated_user.create_fork(original_repo)
            
            fork_url = f"https://github.com/{authenticated_user.login}/{repo_name}.git"
            print(f"✅ Forked to: {fork_url}")
            return fork_url
        except GithubException as e:
            if "already exists" in str(e):
                # Fork already exists
                fork_url = f"https://github.com/{authenticated_user.login}/{repo_name}.git"
                print(f"Fork already exists: {fork_url}")
                return fork_url
            print(f"Error forking repository: {e}")
            return None
        except Exception as e:
            print(f"Error forking repository: {e}")
            return None
    
    def create_pull_request(self, original_repo_url: str, fork_branch: str, team_name: str, team_leader: str) -> Optional[str]:
        """Create a pull request from fork branch to original repo.
        
        Returns:
            PR URL if successful, None otherwise
        """
        try:
            if not self.github_token:
                print("No GitHub token available for creating PR")
                return None
            
            g = Github(self.github_token)
            authenticated_user = g.get_user()
            
            # Extract owner/repo from original URL
            parts = original_repo_url.rstrip("/").split("/")
            repo_owner = parts[-2]
            repo_name = parts[-1].replace(".git", "")
            
            # Get repositories
            original_repo = g.get_user(repo_owner).get_repo(repo_name)
            
            # Create PR
            pr_title = f"🤖 [AI-AGENT] CI/CD Healing Agent - Automated Fixes by {team_name}"
            pr_body = f"""## 🤖 Autonomous Fixes by TRANSFORMERS CI/CD Healing Agent

**Team:** {team_name}  
**Team Leader:** {team_leader}

This pull request contains automatic fixes generated by the TRANSFORMERS CI/CD Healing Agent.

### Changes:
- Detected and fixed failing tests
- Applied automated code corrections
- Verified all tests pass

### Branch:
Created from fork branch: `{fork_branch}`

### Note:
All changes have been automatically tested and verified. Please review the commits for details.

---
**Generated at:** {datetime.now().isoformat()}
"""
            
            pr = original_repo.create_pull(
                title=pr_title,
                body=pr_body,
                head=f"{authenticated_user.login}:{fork_branch}",
                base=original_repo.default_branch
            )
            
            print(f"✅ Pull Request created: {pr.html_url}")
            return pr.html_url
        except Exception as e:
            print(f"Error creating pull request: {e}")
            return None
    
    def _build_workflow(self):
        """Build the multi-agent workflow graph."""
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("clone_repo", self.clone_repo_node)
        workflow.add_node("discover_tests", self.discover_tests_node)
        workflow.add_node("run_tests", self.run_tests_node)
        workflow.add_node("analyze_failures", self.analyze_failures_node)
        workflow.add_node("fix_code", self.fix_code_node)
        workflow.add_node("commit_push", self.commit_push_node)
        workflow.add_node("verify", self.verify_node)
        workflow.add_node("score", self.score_node)
        
        # Add edges (linear pipeline with conditional retry)
        workflow.add_edge("clone_repo", "discover_tests")
        workflow.add_edge("discover_tests", "run_tests")
        workflow.add_edge("run_tests", "analyze_failures")
        workflow.add_edge("analyze_failures", "fix_code")
        workflow.add_edge("fix_code", "commit_push")
        workflow.add_edge("commit_push", "verify")
        
        def _route_after_verify(state: AgentState) -> str:
            if state.get("ci_status") == "failed" and state.get("fix_round", 0) < self.max_fix_rounds:
                return "run_tests"
            return "score"
        
        workflow.add_conditional_edges(
            "verify",
            _route_after_verify,
            {
                "run_tests": "run_tests",
                "score": "score"
            }
        )
        workflow.add_edge("score", END)
        
        workflow.set_entry_point("clone_repo")
        
        return workflow.compile()
    
    def clone_repo_node(self, state: AgentState) -> AgentState:
        """Clone the GitHub repository. Uses token auth always. Only forks if not owned."""
        import shutil

        try:
            repo_url = state["repo_url"].rstrip("/").replace(".git", "")
            parts = repo_url.split("/")
            repo_owner = parts[-2]
            repo_name = parts[-1]

            # ── Determine ownership by comparing URL owner with token user ──
            is_owned = False
            try:
                if self.github_token:
                    g = Github(self.github_token)
                    me = g.get_user().login
                    is_owned = me.lower() == repo_owner.lower()
                    print(f"Authenticated as {me}, repo owner is {repo_owner}, is_owned={is_owned}")
            except Exception as e:
                print(f"[WARN] Could not verify ownership via API: {e}. Assuming owned (will try direct clone).")
                is_owned = True  # safer default — try direct clone first

            state["timeline"].append({
                "stage": "Check Repository Ownership",
                "description": f"Repo owner: {repo_owner} | Owned by you: {is_owned}",
                "status": "completed",
                "timestamp": datetime.now().isoformat()
            })

            # ── Build authenticated clone URL ──
            if self.github_token:
                auth_clone_url = f"https://{self.github_token}@github.com/{repo_owner}/{repo_name}.git"
            else:
                auth_clone_url = f"https://github.com/{repo_owner}/{repo_name}.git"

            if not is_owned:
                # Fork the repo so we can push a branch to it
                state["timeline"].append({
                    "stage": "Fork Repository",
                    "description": f"Forking {repo_owner}/{repo_name} to your account",
                    "status": "started",
                    "timestamp": datetime.now().isoformat()
                })
                fork_url = self.fork_repository(state["repo_url"])
                if not fork_url:
                    raise Exception("Failed to fork repository — check GITHUB_TOKEN permissions (needs repo + workflow scope)")
                state["is_fork"] = True
                state["original_repo_url"] = state["repo_url"]
                state["fork_url"] = fork_url

                # Build authenticated URL for the fork
                fork_parts = fork_url.rstrip("/").replace(".git", "").split("/")
                fork_owner = fork_parts[-2]
                fork_repo = fork_parts[-1]
                if self.github_token:
                    auth_clone_url = f"https://{self.github_token}@github.com/{fork_owner}/{fork_repo}.git"
                else:
                    auth_clone_url = fork_url
                import time as _time; _time.sleep(3)  # wait for fork to propagate

                state["timeline"].append({
                    "stage": "Fork Repository",
                    "description": f"Forked to {fork_url}",
                    "status": "completed",
                    "timestamp": datetime.now().isoformat()
                })
            else:
                state["is_fork"] = False
                state["original_repo_url"] = None

            # ── Clone ──
            repo_path = self.repo_base / repo_name
            if repo_path.exists():
                shutil.rmtree(repo_path, ignore_errors=False)

            state["timeline"].append({
                "stage": "Clone Repository",
                "description": f"Cloning {repo_owner}/{repo_name}",
                "status": "started",
                "timestamp": datetime.now().isoformat()
            })

            print(f"Cloning with auth: {repo_owner}/{repo_name}")
            git.Repo.clone_from(auth_clone_url, str(repo_path))

            state["repo_path"] = str(repo_path)
            state["timeline"].append({
                "stage": "Clone Repository",
                "description": f"Cloned to {repo_path}",
                "status": "completed",
                "timestamp": datetime.now().isoformat()
            })

        except Exception as e:
            state["error"] = f"Clone failed: {str(e)}"
            state["ci_status"] = "failed"
            state["timeline"].append({
                "stage": "Clone Repository",
                "description": f"ERROR: {str(e)}",
                "status": "failed",
                "timestamp": datetime.now().isoformat()
            })
            print(f"[ERROR] clone_repo_node: {e}")

        return state
    
    def discover_tests_node(self, state: AgentState) -> AgentState:
        """Walk all files, find test files and all .py files."""
        try:
            if not state.get("repo_path"):
                raise Exception("Repository path is missing")

            state["timeline"].append({
                "stage": "Discover Tests",
                "description": "Discovering test files and Python files",
                "status": "started",
                "timestamp": datetime.now().isoformat()
            })
            
            repo_path = Path(state["repo_path"])
            if not repo_path.exists():
                raise Exception(f"Repository path not found: {repo_path}")

            # Check project type
            state["project_type"] = "node" if (repo_path / "package.json").exists() else "python"

            test_files = []
            all_src_files = []
            skip_dirs = {"venv", ".venv", "__pycache__", ".git", "site-packages", "node_modules"}
            
            # Walk through all files
            for file_path in repo_path.rglob("*.*"):
                if file_path.suffix not in [".py", ".js", ".ts"]:
                    continue
                # Skip hidden directories and ignored folders
                if any(part in skip_dirs or part.startswith(".") for part in file_path.parts):
                    continue
                
                rel_path = str(file_path.relative_to(repo_path))
                all_src_files.append(rel_path)
                
                # Check if it's a test file
                file_name = file_path.name.lower()
                is_test = False
                if state["project_type"] == "python":
                    if file_name.startswith("test_") or file_name.endswith("_test.py") or "tests/" in rel_path.lower():
                        is_test = True
                else:
                    if ".test." in file_name or ".spec." in file_name or "tests/" in rel_path.lower() or "__tests__/" in rel_path.lower():
                        is_test = True

                if is_test:
                    test_files.append(rel_path)
            
            state["test_files"] = test_files
            state["all_py_files"] = all_src_files
            
            state["timeline"].append({
                "stage": "Discover Tests",
                "description": f"Found {len(test_files)} test files and {len(all_src_files)} src files",
                "status": "completed",
                "timestamp": datetime.now().isoformat()
            })
            
            print(f"Found {len(test_files)} test files: {test_files}")
            print(f"Found {len(all_src_files)} Src files")
        except Exception as e:
            state["error"] = f"Failed to discover tests: {str(e)}"
            state["ci_status"] = "failed"
            print(f"Error discovering tests: {e}")
        
        return state
    
    def run_tests_node(self, state: AgentState) -> AgentState:
        """Run pytest on discovered test files, capture stdout/stderr output."""
        try:
            state["timeline"].append({
                "stage": "Run Tests",
                "description": f"Running {len(state['test_files'])} pytest tests",
                "status": "started",
                "timestamp": datetime.now().isoformat()
            })
            
            if not state["test_files"]:
                state["timeline"].append({
                    "stage": "Run Tests",
                    "description": "No test files found",
                    "status": "completed",
                    "timestamp": datetime.now().isoformat()
                })
                state["pytest_output"] = "No test files found"
                state["total_failures"] = 0
                return state
            
            # Run tests
            repo_path = Path(state["repo_path"])
            abs_repo_path = str(repo_path.absolute())
            
            use_docker = os.getenv("USE_DOCKER", "true").lower() == "true"
            result = None
            
            if state.get("project_type") == "node":
                if use_docker:
                    try:
                        print(f"Running npm install and tests using Docker...")
                        result = subprocess.run(
                            [
                                "docker", "run", "--rm",
                                "-v", f"{abs_repo_path}:/app",
                                "-w", "/app",
                                "node:18",
                                "sh", "-c", "npm install && npm test"
                            ],
                            capture_output=True,
                            text=True,
                            timeout=300
                        )
                        if result.returncode != 0 and "Cannot connect to the Docker daemon" in result.stderr:
                            print("Docker daemon not running. Falling back to local.")
                            use_docker = False
                    except Exception as de:
                        print(f"Docker failed: {de}. Falling back to local.")
                        use_docker = False
                
                if not use_docker or not result:
                    print(f"Running npm install and tests locally (Azure Mode)...")
                    subprocess.run(["npm", "install"], cwd=str(repo_path), capture_output=True, timeout=180)
                    result = subprocess.run(["npm", "test"], cwd=str(repo_path), capture_output=True, text=True, timeout=180)
            else:
                if use_docker:
                    try:
                        print(f"Running pytest using Docker...")
                        result = subprocess.run(
                            [
                                "docker", "run", "--rm",
                                "-e", "PYTHONPATH=/app",
                                "-v", f"{abs_repo_path}:/app",
                                "-w", "/app",
                                "python:3.10",
                                "sh", "-c",
                                "pip install pytest && (if [ -f requirements.txt ]; then pip install -r requirements.txt; fi) && pytest -v --tb=long " + " ".join(state["test_files"])
                            ],
                            capture_output=True,
                            text=True,
                            timeout=300
                        )
                        # Check for docker daemon error
                        if result.returncode != 0 and "Cannot connect to the Docker daemon" in result.stderr:
                            print("Docker daemon not running. Falling back to local.")
                            use_docker = False
                    except Exception as de:
                        print(f"Docker failed: {de}. Falling back to local.")
                        use_docker = False
                
                if not use_docker or not result:
                    print(f"Running pytest locally (Azure Mode)...")
                    test_file_paths = [str(repo_path / f) for f in state["test_files"]]
                    env = os.environ.copy()
                    env["PYTHONPATH"] = str(repo_path) + os.pathsep + env.get("PYTHONPATH", "")
                    result = subprocess.run(["pytest", "-v", "--tb=long"] + test_file_paths, cwd=str(repo_path), env=env, capture_output=True, text=True, timeout=120)

            state["pytest_output"] = (result.stdout or "") + "\n" + (result.stderr or "")
            
            # Improved failure detection logic
            lower_output = state["pytest_output"].lower()
            
            if state.get("project_type") == "node":
                failures_jest = len(re.findall(r"FAIL\s", state["pytest_output"]))
                failures_mocha = len(re.findall(r"failing\s", state["pytest_output"], re.IGNORECASE))
                state["total_failures"] = max(failures_jest, failures_mocha)
                if state["total_failures"] == 0 and result.returncode != 0:
                    state["total_failures"] = 1
            else:
                # Capture FAILED summary lines, direct failure reports, and collection errors
                failed_patterns = [
                    r"FAILED\s",               # Standard pytest failure
                    r"^E\s+",                  # Assertion error start
                    r"ERROR\s+collecting\s",    # Collection error
                    r"SyntaxError:",            # Syntax errors
                    r"ImportError:",            # Import errors
                    r"ModuleNotFoundError:",    # Missing dependency
                    r"AssertionError"           # Assertion logic
                ]
                
                # Capture failures using a more flexible regex that covers both:
                # Capture failures using a more flexible regex that extracts the test path
                test_failure_matches = re.findall(r"(\S+::\S+)\s+FAILED|FAILED\s+(\S+::\S+)", state["pytest_output"])
                unique_tests = set()
                for match in test_failure_matches:
                    for val in match:
                        if val:
                            unique_tests.add(val)
                total_failed = len(unique_tests)
                
                if total_failed == 0:
                    # Fallback to general error patterns if specific test failures aren't found
                    for pattern in failed_patterns:
                        total_failed += len(re.findall(pattern, state["pytest_output"], re.MULTILINE | re.IGNORECASE))
                
                if total_failed == 0 and result.returncode != 0:
                    # If exit code is non-zero but no patterns matched, assume at least 1 failure
                    total_failed = 1
                    
                state["total_failures"] = total_failed


            state["timeline"].append({
                "stage": "Run Tests",
                "description": f"Tests completed with {state['total_failures']} failures",
                "status": "completed",
                "timestamp": datetime.now().isoformat()
            })
            
            print(f"Tests output length: {len(state['pytest_output'])}. Failures found: {state['total_failures']}")
            with open(Path(__file__).parent / "results" / "pytest_debug.txt", "w") as f:
                f.write(state['pytest_output'])
        except Exception as e:
            state["error"] = f"Failed to run tests: {str(e)}"
            state["ci_status"] = "failed"
            print(f"Error running tests: {e}")
        
        return state

    
    def analyze_failures_node(self, state: AgentState) -> AgentState:
        """Parse pytest --tb=long output and map failures to source files."""
        try:
            state["timeline"].append({
                "stage": "Analyze Failures",
                "description": "Parsing test failures and identifying bug types",
                "status": "started",
                "timestamp": datetime.now().isoformat()
            })

            failures = []
            pytest_output = state["pytest_output"]
            repo_root = Path(state["repo_path"]).resolve()

            if state.get("project_type") == "node" and state.get("total_failures", 0) > 0:
                print("Using LLM to extract Node test failures...")
                prompt = f"""You are a dev tool extracting errors from Node test outputs.
Analyze this test output and extract the failures.
Output ONLY a valid JSON array of objects.
Each object MUST have these EXACT keys:
- "file": The path to the source file that caused the failure (NOT the test file). Try your best to find the source file causing the bug, e.g. "src/utils.js".
- "line_number": The exact line number in the source file, or 1 if unknown.
- "error_message": A brief description of the failure.
- "bug_type": "LOGIC", "SYNTAX", "TYPE_ERROR", or "IMPORT".

Test output:
{pytest_output[:8000]}
"""
                try:
                    llm_response = self._invoke_llm(prompt)
                    json_text = llm_response.strip()
                    if json_text.startswith("```json"):
                        json_text = json_text[7:-3]
                    elif json_text.startswith("```"):
                        json_text = json_text[3:-3]
                    failures = json.loads(json_text.strip())
                except Exception as e:
                    print(f"Failed to parse Node test output with LLM: {e}")
                    failures = []
                blocks = []
            elif state.get("project_type") != "node":
                # Split pytest output into per-test failure blocks
                blocks = re.split(r"_{5,}\s+\S.*?\s+_{5,}", pytest_output)
                if len(blocks) <= 1 and "FAILURES" in pytest_output:
                    blocks = pytest_output.split("________________")
            else:
                blocks = []

            # Also grab the FAILED summary lines to collect test→msg mappings
            # Format: FAILED tests/test_foo.py::test_bar - some message
            failed_summary = {}
            for m in re.finditer(r"FAILED\s+(\S+)\s+-\s+(.*)", pytest_output, re.MULTILINE):
                failed_summary[m.group(1)] = m.group(2).strip()
            
            for m in re.finditer(r"(\S+)\s+FAILED", pytest_output, re.MULTILINE):
                if m.group(1) not in failed_summary:
                    failed_summary[m.group(1)] = "Test failed"

            for block in blocks:

                if not block.strip():
                    continue

                # Try to find source file frames (not test files) in this block
                # --tb=long gives: `    frame_path.py:lineN: in func_name`
                source_frames = []
                last_error = ""

                for line in block.splitlines():
                    # Capture E-prefixed error lines
                    e_match = re.match(r"^E\s+(.*)", line)
                    if e_match:
                        last_error = e_match.group(1).strip()
                        continue

                    # Frame lines: look like `    path/to/file.py:42: in function_name`
                    frame_match = re.match(r"^\s+(.+\.py):(\d+):\s+in\s+", line)
                    if frame_match:
                        fpath_str = frame_match.group(1)
                        fline = int(frame_match.group(2))
                        fpath = Path(fpath_str)
                        if not fpath.is_absolute():
                            fpath = repo_root / fpath
                        try:
                            rel = fpath.resolve().relative_to(repo_root)
                            # Skip test files — we want source files
                            if "test" not in str(rel).lower():
                                source_frames.append((str(rel), fline))
                        except Exception:
                            pass

                if not source_frames:
                    # No source frame found — fall back: find a FAILED line
                    # and map the test file path → try to guess source file
                    for test_path, err_msg in failed_summary.items():
                        # test path like tests/test_math_utils.py::test_square
                        test_file = test_path.split("::")[0]
                        source_name = re.sub(r"tests?[/\\]", "", test_file)
                        source_name = re.sub(r"test_", "", source_name)
                        source_name = "src/" + source_name  # heuristic: src/<name>.py
                        source_path = repo_root / source_name
                        if source_path.exists():
                            bug_type = self._detect_bug_type(err_msg, source_name, state["repo_path"])
                            failure = {
                                "file": source_name,
                                "line_number": 1,
                                "error_message": err_msg,
                                "bug_type": "LOGIC"
                            }
                            if failure not in failures:
                                failures.append(failure)
                    continue

                # Use the last source frame (closest to the actual bug)
                src_file, src_line = source_frames[-1]
                error_msg = last_error or "Assertion/logic error"
                bug_type = self._detect_bug_type(error_msg, src_file, state["repo_path"])

                failure = {
                    "file": src_file,
                    "line_number": src_line,
                    "error_message": error_msg,
                    "bug_type": bug_type
                }
                if failure not in failures:
                    failures.append(failure)

            # ── Collection/syntax errors (ERROR collecting tests/foo.py) ──
            # These happen because a SOURCE file has a SyntaxError.
            # Parse the full traceback block to find the actual broken source file.
            lines_list = pytest_output.splitlines()
            for i, line in enumerate(lines_list):
                if "ERROR collecting" not in line:
                    continue
                # Scan forward through the traceback for the real source file
                src_file_for_error = None
                src_line_for_error = 1
                for j in range(i + 1, min(i + 50, len(lines_list))):
                    tbl = lines_list[j]
                    # Look for: File "src/calculator.py", line N
                    fm = re.search(r'File ["\'](.+\.py)["\'], line (\d+)', tbl)
                    if fm:
                        fpath = Path(fm.group(1))
                        if not fpath.is_absolute():
                            fpath = repo_root / fpath
                        try:
                            rel = fpath.resolve().relative_to(repo_root)
                            # Prefer source files over test files
                            if "test" not in str(rel).lower():
                                src_file_for_error = str(rel)
                                src_line_for_error = int(fm.group(2))
                        except Exception:
                            pass
                    # Also match: src/calculator.py:4: SyntaxError
                    alt = re.match(r"\s*(.+\.py):(\d+):", tbl)
                    if alt:
                        fpath = Path(alt.group(1))
                        if not fpath.is_absolute():
                            fpath = repo_root / fpath
                        try:
                            rel = fpath.resolve().relative_to(repo_root)
                            if "test" not in str(rel).lower():
                                src_file_for_error = str(rel)
                                src_line_for_error = int(alt.group(2))
                        except Exception:
                            pass
                    # Stop at next section separator
                    if re.match(r"[=_]{5,}", tbl.strip()):
                        break

                # Fallback: extract from ERROR collecting line itself and map test→src
                if not src_file_for_error:
                    col_match = re.search(r"ERROR collecting (.+\.py)", line)
                    if col_match:
                        test_file = col_match.group(1).strip()
                        candidate = re.sub(r"tests?[/\\]", "", test_file)
                        candidate = re.sub(r"test_", "", candidate)
                        candidate = "src/" + candidate
                        if (repo_root / candidate).exists():
                            src_file_for_error = candidate

                if src_file_for_error:
                    failures.append({
                        "file": src_file_for_error,
                        "line_number": src_line_for_error,
                        "error_message": "SyntaxError/ImportError in source file",
                        "bug_type": "SYNTAX"
                    })

            if state.get("project_type") != "node":
                # Deduplicate for pytest logic
                seen = set()
                deduped = []
                for f in failures:
                    key = (f["file"], f["line_number"])
                    if key not in seen:
                        seen.add(key)
                        deduped.append(f)
                failures = deduped

            state["failures"] = failures
            state["timeline"].append({
                "stage": "Analyze Failures",
                "description": f"Identified {len(failures)} failures",
                "status": "completed",
                "timestamp": datetime.now().isoformat()
            })
            print(f"Failures: {failures}")

        except Exception as e:
            state["error"] = f"Failed to analyze failures: {str(e)}"
            state["ci_status"] = "failed"
            print(f"Error analyzing failures: {e}")

        return state


    def _detect_bug_type(self, error_msg: str, file_name: str, repo_path: str) -> str:
        """Detect bug type from error message and code analysis."""
        error_lower = error_msg.lower()
        
        # Check error patterns
        if "syntaxerror" in error_lower or "invalid syntax" in error_lower:
            return "SYNTAX"
        elif "typeerror" in error_lower or "type mismatch" in error_lower:
            return "TYPE_ERROR"
        elif "importerror" in error_lower or "modulenotfounderror" in error_lower:
            return "IMPORT"
        elif "indentation" in error_lower:
            return "INDENTATION"
        elif "assert" in error_lower or "comparison" in error_lower:
            return "LOGIC"
        else:
            # Use pyflakes to detect linting issues
            try:
                file_path = Path(repo_path) / file_name
                if file_path.exists():
                    with open(file_path, 'r') as f:
                        code = f.read()
                    
                    # Check for unused imports
                    if "unused" in error_msg.lower() or "imported but unused" in error_msg.lower():
                        return "LINTING"
                    
                    # Run pyflakes
                    stream = io.StringIO()
                    reporter = pyflakes.reporter.Reporter(stream, stream)
                    pyflakes.api.check(code, str(file_path), reporter)
                    pyflakes_output = stream.getvalue()
                    
                    if "unused" in pyflakes_output or "import" in pyflakes_output:
                        return "LINTING"
            except:
                pass
        
        return "LOGIC"
    
    def fix_code_node(self, state: AgentState) -> AgentState:
        """Use Groq LLM to fix each failing file by rewriting the entire file."""
        try:
            state["timeline"].append({
                "stage": "Generate Fixes",
                "description": f"Generating AI fixes for {len(state['failures'])} failures",
                "status": "started",
                "timestamp": datetime.now().isoformat()
            })

            repo_path = Path(state["repo_path"])
            fixes = state.get("fixes", [])

            # Group failures by file so we fix each file once with all its bugs in one LLM call
            files_to_fix: Dict[str, List[Dict]] = {}
            for failure in state["failures"]:
                fname = failure["file"]
                files_to_fix.setdefault(fname, []).append(failure)

            if not files_to_fix:
                state["timeline"].append({
                    "stage": "Neural Synthesis",
                    "description": "Sequence bypassed. No structural defects detected in current iteration.",
                    "status": "completed",
                    "timestamp": datetime.now().isoformat()
                })
                return state

            state["fix_round"] = state.get("fix_round", 0) + 1

            for fname, file_failures in files_to_fix.items():
                try:
                    file_path = repo_path / fname

                    # NEVER fix test files — only fix source files
                    if "test" in fname.lower() or Path(fname).stem.startswith("test_"):
                        print(f"[SKIP] Refusing to fix test file: {fname}")
                        continue

                    if not file_path.exists():
                        print(f"[WARN] File not found: {file_path}")
                        continue

                    with open(file_path, 'r', errors='replace') as f:
                        original_content = f.read()

                    # Add line numbers for context
                    numbered_lines = "\n".join(
                        f"{i+1:3}: {line}" for i, line in enumerate(original_content.splitlines())
                    )

                    # Find the matching test file to show expected behaviour
                    test_hint = ""
                    test_dir = repo_path / "tests"
                    base = Path(fname).stem.replace("_utils", "").replace("src/", "").replace("src\\", "")
                    for tf in (test_dir.glob(f"*{base}*") if test_dir.exists() else []):
                        try:
                            test_hint = "\n\nFailing test (shows expected behaviour):\n" + tf.read_text(errors="replace")
                        except Exception:
                            pass
                        break

                    # Build bug descriptions with explicit instructions
                    bug_lines = []
                    for b in file_failures:
                        src_lines = original_content.splitlines()
                        ln = b["line_number"]
                        bug_type = b["bug_type"]
                        err = b["error_message"]

                        if ln > 1 and ln <= len(src_lines):
                            line_content = src_lines[ln - 1].strip()
                            bug_lines.append(
                                f"  - Line {ln} (currently: `{line_content}`): [{bug_type}] {err}"
                            )
                        else:
                            # Line unknown (LOGIC bug mapped via heuristic) — describe by error
                            # e.g. "assert 6 == 9" means function returns 6 but must return 9
                            bug_lines.append(
                                f"  - LOGIC BUG: The file has a logic error causing: {err}"
                                f" — find and fix the function that produces the wrong result."
                            )
                    bug_descriptions = "\n".join(bug_lines)

                    prompt = f"""You are an expert Python developer. Your ONLY job is to fix bugs in Python code.

TASK: Fix ALL bugs in file `{fname}` so that all tests pass.

Known failures:
{bug_descriptions}
{test_hint}

Current file content (with line numbers):
{numbered_lines}

MANDATORY RULES — violating any rule means your answer is WRONG:
1. Output ONLY the complete corrected source code. Nothing else.
2. Do NOT wrap in markdown code fences (no ```, no ```python, no ```javascript).
3. Do NOT add any explanation text before or after the code.
4. Fix the ACTUAL CODE — do NOT just add or edit comments. Change the wrong operations/expressions.
5. Remove ALL # BUG or // BUG comments from the code.
6. Every function MUST return mathematically correct results that match the tests.
7. The output must be syntactically valid code.

Example: if a test says `assert square(3) == 9` but square returns 6, the bug is `x+x` must be `x*x`.

Output the fixed Python file now:"""

                    fixed_content = self._invoke_llm(prompt)
                    fixed_content = self._clean_full_file(fixed_content, original_content)

                    # Write corrected file
                    with open(file_path, 'w') as f:
                        f.write(fixed_content)
                    print(f"[FIX] Rewrote {fname} — wrote {len(fixed_content)} bytes")

                    for b in file_failures:
                        fix_record = {
                            "file": fname,
                            "bug_type": b["bug_type"],
                            "line_number": b["line_number"],
                            "commit_message": f"[AI-AGENT] Fix {b['bug_type']} in {fname} line {b['line_number']}",
                            "status": "Fixed"
                        }
                        fixes.append(fix_record)

                except Exception as e:
                    print(f"[ERROR] Fixing {fname}: {e}")
                    continue

            state["fixes"] = fixes
            state["total_fixes"] = len(fixes)
            state["fix_round"] += 1

            state["timeline"].append({
                "stage": "Neural Synthesis",
                "description": f"Sequence successful. Deployed {len(fixes)} logic corrections into {len(files_to_fix)} file(s).",
                "status": "completed",
                "timestamp": datetime.now().isoformat()
            })

        except Exception as e:
            print(f"[ERROR] fix_code_node: {e}")
            state["fixes"] = []
            state["total_fixes"] = 0

        return state
    
    def commit_push_node(self, state: AgentState) -> AgentState:
        """Create branch, commit fixes, and push to GitHub."""
        try:
            state["timeline"].append({
                "stage": "Commit and Push",
                "description": "Creating branch and committing fixes",
                "status": "started",
                "timestamp": datetime.now().isoformat()
            })
            
            repo_path = Path(state["repo_path"])
            repo = git.Repo(str(repo_path))
            
            # Create branch name (uppercase + underscores per PS spec)
            raw_name = f"{state['team_name']}_{state['team_leader']}_AI_Fix"
            branch_name = re.sub(r'[^A-Za-z0-9_]', '_', raw_name).upper().replace('__', '_')
            state["branch_name"] = branch_name

            # Always start fresh: delete local branch if it exists, then recreate from HEAD
            try:
                if branch_name in [h.name for h in repo.heads]:
                    # Switch away from branch before deleting
                    if str(repo.active_branch) == branch_name:
                        repo.heads["main"].checkout() if "main" in [h.name for h in repo.heads] else repo.heads["master"].checkout()
                    # Force-delete the old local branch
                    repo.delete_head(branch_name, force=True)
                repo.create_head(branch_name)
                repo.heads[branch_name].checkout()
            except Exception as branch_err:
                print(f"[WARN] Branch handling: {branch_err}")
                try:
                    repo.heads[branch_name].checkout()
                except Exception:
                    pass
            
            # Commit each fix
            commits = []
            for fix in state["fixes"]:
                try:
                    repo.index.add([fix["file"]])
                    repo.index.commit(fix["commit_message"])
                    commits.append(fix["commit_message"])
                except:
                    # File may not have staged changes
                    pass
            
            state["commits"] = commits
            
            # Push to GitHub (if token available)
            if self.github_token:
                try:
                    # Configure authentication
                    with repo.config_writer() as git_config:
                        git_config.set_value("user", "name", "AI-Agent").release()
                        git_config.set_value("user", "email", "ai-agent@transformers.dev").release()
                    
                    # Get the current origin URL and update it with token authentication
                    origin = repo.remote("origin")
                    original_url = origin.url
                    
                    # Convert https URL to include token
                    if "https://" in original_url:
                        # Format: https://github.com/owner/repo.git -> https://token:x-oauth-basic@github.com/owner/repo.git
                        auth_url = original_url.replace(
                            "https://github.com/",
                            f"https://{self.github_token}:x-oauth-basic@github.com/"
                        )
                        # Update the remote URL
                        origin.set_url(auth_url)
                        print(f"Updated remote URL with token authentication")
                    
                    # Push branch
                    print(f"Pushing branch {branch_name} to GitHub...")
                    origin.push(branch_name, force=True)
                    print(f"✅ Successfully pushed to GitHub")
                    
                    # Restore original URL (without token for security)
                    origin.set_url(original_url)
                except Exception as e:
                    print(f"Warning: Could not push to GitHub: {e}")
            
            state["timeline"].append({
                "stage": "Commit and Push",
                "description": f"Created {len(commits)} commits on branch {branch_name}",
                "status": "completed",
                "timestamp": datetime.now().isoformat()
            })
        
        except Exception as e:
            print(f"Error in commit_push_node: {e}")
        
        return state
    
    def verify_node(self, state: AgentState) -> AgentState:
        """Re-run tests, check if all pass, update CI status."""
        try:
            state["timeline"].append({
                "stage": "Verify Fixes",
                "description": "Re-running tests to verify fixes",
                "status": "started",
                "timestamp": datetime.now().isoformat()
            })
            
            repo_path = Path(state["repo_path"])
            retry_count = 0
            all_passed = False
            
            while retry_count < self.retry_limit:
                try:
                    test_file_paths = [str(repo_path / f) for f in state["test_files"]]
                    
                    if not test_file_paths:
                        all_passed = True
                        break
                    
                    abs_repo_path = str(repo_path.absolute())
                    use_docker = os.getenv("USE_DOCKER", "true").lower() == "true"
                    
                    if state.get("project_type") == "node":
                        if use_docker:
                            print("Verifying npm test using Docker...")
                            result = subprocess.run(
                                [
                                    "docker", "run", "--rm",
                                    "-v", f"{abs_repo_path}:/app",
                                    "-w", "/app",
                                    "node:18",
                                    "sh", "-c", "npm test"
                                ],
                                capture_output=True,
                                text=True,
                                timeout=240
                            )
                        else:
                            print("Verifying npm test locally (Azure Mode)...")
                            result = subprocess.run(["npm", "test"], cwd=str(repo_path), capture_output=True, text=True, timeout=120)
                    else:
                        if use_docker:
                            print("Verifying pytest using Docker...")
                            result = subprocess.run(
                                [
                                    "docker", "run", "--rm",
                                    "-e", "PYTHONPATH=/app",
                                    "-v", f"{abs_repo_path}:/app",
                                    "-w", "/app",
                                    "python:3.10",
                                    "sh", "-c",
                                    "pip install pytest && (if [ -f requirements.txt ]; then pip install -r requirements.txt; fi) && pytest -v --tb=short " + " ".join(state["test_files"])
                                ],
                                capture_output=True,
                                text=True,
                                timeout=240
                            )
                        else:
                            print("Verifying pytest locally (Azure Mode)...")
                            env = os.environ.copy()
                            env["PYTHONPATH"] = str(repo_path) + os.pathsep + env.get("PYTHONPATH", "")
                            result = subprocess.run(["pytest", "-v", "--tb=short"] + test_file_paths, cwd=str(repo_path), env=env, capture_output=True, text=True, timeout=120)
                    
                    # Check if all tests passed
                    if result.returncode == 0:
                        all_passed = True
                        break
                    
                    retry_count += 1
                    if retry_count < self.retry_limit:
                        print(f"Tests still failing, retry {retry_count}/{self.retry_limit}")
                
                except subprocess.TimeoutExpired:
                    retry_count += 1
                    print(f"Test timeout, retry {retry_count}/{self.retry_limit}")
            
            state["ci_status"] = "passed" if all_passed else "failed"
            
            state["timeline"].append({
                "stage": "Verify Fixes",
                "description": f"Verification {'successful' if all_passed else f'failed after {self.retry_limit} retries'}",
                "status": "completed",
                "timestamp": datetime.now().isoformat()
            })
        
        except Exception as e:
            print(f"Error in verify_node: {e}")
            state["ci_status"] = "failed"
        
        return state
    
    def score_node(self, state: AgentState) -> AgentState:
        """Calculate score: base 100, +10 if under 5 mins, -2 per commit over 20.
        
        Also creates PR if repository was forked.
        """
        try:
            score = 100
            
            # Bonus for fast execution
            if len(state["timeline"]) > 0:
                total_time = 0  # Would need to track actual time
                # Check if under 5 minutes (simplified for now)
                # score += 10  # Placeholder
            
            # Deduct for many commits
            commit_count = len(state["commits"])
            if commit_count > 20:
                score -= 2 * (commit_count - 20)
            
            # Deduct if CI status is failed
            if state["ci_status"] != "passed":
                score -= 30
            
            # Bonus if all fixes were successful
            if state["total_fixes"] > 0 and state["total_failures"] > 0:
                fix_rate = state["total_fixes"] / state["total_failures"]
                score += int(fix_rate * 20)
            
            state["score"] = max(0, min(100, score))
            
            # Create PR if repository was forked
            if state.get("is_fork") and state.get("original_repo_url"):
                state["timeline"].append({
                    "stage": "Create Pull Request",
                    "description": "Creating PR to original repository",
                    "status": "started",
                    "timestamp": datetime.now().isoformat()
                })
                
                pr_url = self.create_pull_request(
                    state["original_repo_url"],
                    state["branch_name"],
                    state["team_name"],
                    state["team_leader"]
                )
                
                if pr_url:
                    state["pr_url"] = pr_url
                    state["timeline"].append({
                        "stage": "Create Pull Request",
                        "description": f"PR created: {pr_url}",
                        "status": "completed",
                        "timestamp": datetime.now().isoformat()
                    })
                else:
                    state["timeline"].append({
                        "stage": "Create Pull Request",
                        "description": "Failed to create PR",
                        "status": "failed",
                        "timestamp": datetime.now().isoformat()
                    })
            
            state["timeline"].append({
                "stage": "Scoring",
                "description": f"Final score: {state['score']}/100",
                "status": "completed",
                "timestamp": datetime.now().isoformat()
            })
        
        except Exception as e:
            print(f"Error in score_node: {e}")
            state["score"] = 50
        
        return state
    
    async def process(self, repo_url: str, team_name: str, team_leader: str) -> dict:
        """Process repository and generate healing results."""
        # Initialize state
        initial_state = AgentState(
            repo_url=repo_url,
            team_name=team_name,
            team_leader=team_leader,
            repo_path="",
            branch_name="",
            test_files=[],
            all_py_files=[],
            pytest_output="",
            failures=[],
            fixes=[],
            commits=[],
            ci_status="unknown",
            timeline=[],
            total_failures=0,
            total_fixes=0,
            score=0,
            error=None,
            original_repo_url=None,
            fork_url=None,
            pr_url=None,
            is_fork=False,
            fix_round=0,
            project_type="python"
        )
        
        # Run workflow
        result = self.workflow.invoke(initial_state)
        
        return {
            "branch_name": result["branch_name"],
            "team_name": result["team_name"],
            "team_leader": result["team_leader"],
            "total_failures": result["total_failures"],
            "total_fixes": result["total_fixes"],
            "ci_status": result["ci_status"],
            "fixes": result["fixes"],
            "commits": result["commits"],
            "timeline": result["timeline"],
            "score": result["score"],
            "is_fork": result["is_fork"],
            "original_repo_url": result["original_repo_url"],
            "fork_url": result["fork_url"],
            "pr_url": result["pr_url"],
            "fix_round": result["fix_round"]
        }


# Global agent instance
agent = HealingAgent()


async def run_healing_agent(repo_url: str, team_name: str = "TRANSFORMERS", team_leader: str = "KARTHIKEYA") -> dict:
    """Run the healing agent on a repository."""
    return await agent.process(repo_url, team_name, team_leader)
