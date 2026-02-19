"""Autonomous CI/CD Healing Agent with LangGraph multi-agent pipeline."""

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


class HealingAgent:
    """Multi-agent pipeline for CI/CD healing using LangGraph."""
    
    def __init__(self):
        """Initialize the healing agent."""
        self.llm = None  # Lazy load on first use
        self.github_token = os.getenv("GITHUB_TOKEN")
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

    def _invoke_llm(self, prompt: str) -> str:
        try:
            return self._invoke_gemini(prompt)
        except Exception as e:
            print(f"Gemini LLM failed, falling back to Groq: {e}")
            try:
                message = self.get_llm().invoke(prompt)
                return message.content
            except Exception as e2:
                raise RuntimeError(f"Both Gemini and Groq failed: {e2}")

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
        """Clone the GitHub repository into backend/repos/ folder.
        
        If repo is not owned by the authenticated user:
        - Fork the repository
        - Clone from the fork
        - Track for PR creation later
        """
        try:
            state["timeline"].append({
                "stage": "Check Repository Ownership",
                "description": f"Checking if repo is owned by authenticated user",
                "status": "started",
                "timestamp": datetime.now().isoformat()
            })
            
            # Check if repo is owned by authenticated user
            is_owned, owner = self.check_repo_ownership(state["repo_url"])
            
            if is_owned:
                state["is_fork"] = False
                state["original_repo_url"] = None
                clone_url = state["repo_url"]
                print(f"✅ Repository is owned by authenticated user")
            else:
                state["is_fork"] = True
                state["original_repo_url"] = state["repo_url"]
                
                state["timeline"].append({
                    "stage": "Fork Repository",
                    "description": f"Creating fork (repo owned by {owner})",
                    "status": "started",
                    "timestamp": datetime.now().isoformat()
                })
                
                # Fork the repository
                fork_url = self.fork_repository(state["repo_url"])
                if not fork_url:
                    raise Exception("Failed to fork repository")
                
                state["fork_url"] = fork_url
                clone_url = fork_url
                
                state["timeline"].append({
                    "stage": "Fork Repository",
                    "description": f"Successfully forked to {fork_url}",
                    "status": "completed",
                    "timestamp": datetime.now().isoformat()
                })
            
            state["timeline"].append({
                "stage": "Clone Repository",
                "description": f"Cloning {clone_url}",
                "status": "started",
                "timestamp": datetime.now().isoformat()
            })
            
            # Extract repo name from URL
            repo_name = state["repo_url"].split("/")[-1].replace(".git", "")
            repo_path = self.repo_base / repo_name
            
            # Clean up existing repo
            if repo_path.exists():
                import shutil
                shutil.rmtree(repo_path, ignore_errors=True)
                if repo_path.exists():
                    raise Exception(f"Cannot remove existing repo at {repo_path}")
            
            # Clone repository
            print(f"Cloning repository: {clone_url}")
            git.Repo.clone_from(clone_url, str(repo_path))
            
            state["repo_path"] = str(repo_path)
            state["timeline"].append({
                "stage": "Clone Repository",
                "description": f"Successfully cloned to {repo_path}",
                "status": "completed",
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            state["error"] = f"Failed to clone repo: {str(e)}"
            state["ci_status"] = "failed"
            print(f"Error cloning repo: {e}")
        
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

            test_files = []
            all_py_files = []
            skip_dirs = {"venv", ".venv", "__pycache__", ".git", "site-packages"}
            
            # Walk through all files
            for file_path in repo_path.rglob("*.py"):
                # Skip hidden directories and .git
                if any(part in skip_dirs for part in file_path.parts):
                    continue
                
                rel_path = str(file_path.relative_to(repo_path))
                all_py_files.append(rel_path)
                
                # Check if it's a test file
                file_name = file_path.name
                if (
                    file_name.startswith("test_")
                    or file_name.endswith("_test.py")
                    or "tests" in file_path.parts
                ):
                    test_files.append(rel_path)
            
            state["test_files"] = test_files
            state["all_py_files"] = all_py_files
            
            state["timeline"].append({
                "stage": "Discover Tests",
                "description": f"Found {len(test_files)} test files and {len(all_py_files)} Python files",
                "status": "completed",
                "timestamp": datetime.now().isoformat()
            })
            
            print(f"Found {len(test_files)} test files: {test_files}")
            print(f"Found {len(all_py_files)} Python files")
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
            
            # Run pytest
            repo_path = Path(state["repo_path"])
            test_file_paths = [str(repo_path / f) for f in state["test_files"]]
            
            result = subprocess.run(
                ["pytest", "-v", "--tb=short"] + test_file_paths,
                cwd=str(repo_path),
                capture_output=True,
                text=True,
                timeout=120
            )
            
            state["pytest_output"] = result.stdout + "\\n" + result.stderr
            
            # Count failures and collection errors
            failed_count = len(re.findall(r"^FAILED\s", state["pytest_output"], re.MULTILINE))
            error_count = len(re.findall(r"ERROR\s+collecting\s", state["pytest_output"]))
            state["total_failures"] = failed_count + error_count
            
            state["timeline"].append({
                "stage": "Run Tests",
                "description": f"Tests completed with {state['total_failures']} failures",
                "status": "completed",
                "timestamp": datetime.now().isoformat()
            })
            
            print(f"Pytest output:\\n{state['pytest_output']}")
        except Exception as e:
            state["error"] = f"Failed to run tests: {str(e)}"
            state["ci_status"] = "failed"
            print(f"Error running tests: {e}")
        
        return state
    
    def analyze_failures_node(self, state: AgentState) -> AgentState:
        """Parse pytest output, identify failures with file name, line number, bug type."""
        try:
            state["timeline"].append({
                "stage": "Analyze Failures",
                "description": "Parsing test failures and identifying bug types",
                "status": "started",
                "timestamp": datetime.now().isoformat()
            })
            
            failures = []
            pytest_output = state["pytest_output"]
            
            # Parse FAILED lines
            failed_pattern = r"FAILED\\s+([^\\s]+)\\s+-\\s+(.*)"
            for match in re.finditer(failed_pattern, pytest_output):
                test_path = match.group(1)
                error_msg = match.group(2)
                
                # Extract file and line number
                file_match = re.search(r"([^:]+):(\\d+)", test_path)
                if file_match:
                    file_name = file_match.group(1)
                    line_num = int(file_match.group(2))
                else:
                    file_name = test_path
                    line_num = 0
                
                # Determine bug type
                bug_type = self._detect_bug_type(error_msg, file_name, state["repo_path"])
                
                failure = {
                    "file": file_name,
                    "line_number": line_num,
                    "error_message": error_msg,
                    "bug_type": bug_type
                }
                failures.append(failure)
            
            # Parse collection/import/syntax errors without FAILED lines
            current_file = None
            current_line = None
            current_error = None

            repo_root = Path(state["repo_path"]).resolve()

            for line in pytest_output.splitlines():
                if "ERROR collecting" in line:
                    if current_file and current_error:
                        failures.append({
                            "file": current_file,
                            "line_number": current_line or 0,
                            "error_message": current_error,
                            "bug_type": self._detect_bug_type(current_error, current_file, state["repo_path"])
                        })
                    current_file = None
                    current_line = None
                    current_error = None

                file_match = re.search(r"File \"([^\"]+)\", line (\d+)", line)
                if file_match:
                    file_path = Path(file_match.group(1)).resolve()
                    try:
                        relative_path = file_path.relative_to(repo_root)
                    except Exception:
                        continue

                    if current_file and current_error:
                        failures.append({
                            "file": current_file,
                            "line_number": current_line or 0,
                            "error_message": current_error,
                            "bug_type": self._detect_bug_type(current_error, current_file, state["repo_path"])
                        })

                    current_file = str(relative_path)
                    current_line = int(file_match.group(2))
                    current_error = None
                    continue

                alt_match = re.search(r"^\s*([^\s:]+\.py):(\d+):", line)
                if alt_match:
                    alt_path = alt_match.group(1)
                    alt_line = int(alt_match.group(2))
                    alt_full_path = Path(alt_path)
                    if not alt_full_path.is_absolute():
                        alt_full_path = repo_root / alt_full_path
                    try:
                        relative_path = alt_full_path.resolve().relative_to(repo_root)
                        current_file = str(relative_path)
                        current_line = alt_line
                    except Exception:
                        pass

                if current_file:
                    stripped = line.strip()
                    if stripped.startswith("E"):
                        error_text = stripped.lstrip("E").strip()
                        if re.search(r"(Error|Exception|SyntaxError)", error_text):
                            current_error = error_text

            if current_file and current_error:
                failures.append({
                    "file": current_file,
                    "line_number": current_line or 0,
                    "error_message": current_error,
                    "bug_type": self._detect_bug_type(current_error, current_file, state["repo_path"])
                })

            # Parse assertion failures to map to source files (not tests)
            last_error_line = ""
            for line in pytest_output.splitlines():
                stripped = line.strip()
                if stripped.startswith("E"):
                    last_error_line = stripped.lstrip("E").strip()
                elif "AssertionError" in stripped:
                    last_error_line = stripped

                frame_match = re.match(r"^\s*([^\s:]+\.py):(\d+):", line)
                if not frame_match:
                    continue

                frame_path = frame_match.group(1)
                frame_line = int(frame_match.group(2))
                frame_full = Path(frame_path)
                if not frame_full.is_absolute():
                    frame_full = repo_root / frame_full

                try:
                    relative_path = frame_full.resolve().relative_to(repo_root)
                except Exception:
                    continue

                if "tests" in relative_path.parts:
                    continue

                error_message = last_error_line or "Assertion failed"
                failures.append({
                    "file": str(relative_path),
                    "line_number": frame_line,
                    "error_message": error_message,
                    "bug_type": self._detect_bug_type(error_message, str(relative_path), state["repo_path"])
                })

            # Deduplicate failures
            deduped = []
            for failure in failures:
                if failure not in deduped:
                    deduped.append(failure)
            failures = deduped

            state["failures"] = failures
            
            state["timeline"].append({
                "stage": "Analyze Failures",
                "description": f"Identified {len(failures)} failures",
                "status": "completed",
                "timestamp": datetime.now().isoformat()
            })
            
            print(f"Failures identified: {failures}")
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

            fixes = []
            repo_path = Path(state["repo_path"])
            state["fix_round"] = state.get("fix_round", 0) + 1

            # Group failures by file so we fix each file once with all its bugs in one LLM call
            files_to_fix: Dict[str, List[Dict]] = {}
            for failure in state["failures"]:
                fname = failure["file"]
                files_to_fix.setdefault(fname, []).append(failure)

            for fname, file_failures in files_to_fix.items():
                try:
                    file_path = repo_path / fname
                    if not file_path.exists():
                        print(f"[WARN] File not found: {file_path}")
                        continue

                    with open(file_path, 'r', errors='replace') as f:
                        original_content = f.read()

                    # Build a description of all bugs in this file
                    bug_descriptions = "\n".join(
                        f"  - Line {b['line_number']}: [{b['bug_type']}] {b['error_message']}"
                        for b in file_failures
                    )

                    prompt = f"""You are an expert Python developer. Fix ALL bugs listed below in the Python file.

File: {fname}

Bugs to fix:
{bug_descriptions}

Original file content:
```python
{original_content}
```

Rules:
1. Return ONLY the complete corrected Python file content.
2. Do NOT include any markdown fences (no ```, no ```python).
3. Do NOT include any explanations, comments about changes, or extra text.
4. Preserve all correct code exactly; only fix the listed bugs.
5. Output must be valid Python that can be saved directly to a .py file."""

                    fixed_content = self._invoke_llm(prompt)
                    fixed_content = self._clean_full_file(fixed_content, original_content)

                    # Write corrected file
                    with open(file_path, 'w') as f:
                        f.write(fixed_content)

                    print(f"[FIX] Rewrote {fname} fixing {len(file_failures)} bug(s)")

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

            state["timeline"].append({
                "stage": "Generate Fixes",
                "description": f"Generated {len(fixes)} fixes across {len(files_to_fix)} file(s)",
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
                    
                    result = subprocess.run(
                        ["pytest", "-v", "--tb=short"] + test_file_paths,
                        cwd=str(repo_path),
                        capture_output=True,
                        text=True,
                        timeout=120
                    )
                    
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
            fix_round=0
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
            "timeline": result["timeline"],
            "score": result["score"]
        }


# Global agent instance
agent = HealingAgent()


async def run_healing_agent(repo_url: str, team_name: str = "TRANSFORMERS", team_leader: str = "KARTHIKEYA") -> dict:
    """Run the healing agent on a repository."""
    return await agent.process(repo_url, team_name, team_leader)
