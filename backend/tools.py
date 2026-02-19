"""
Helper tools for the Autonomous CI/CD Healing Agent.
"""

import subprocess
import json
import re
import os
from pathlib import Path
from typing import List, Dict, Any, Tuple
from datetime import datetime
import pyflakes.api
import pyflakes.reporter
import io
import git


def run_pyflakes(file_path: str) -> List[Dict[str, Any]]:
    """
    Run pyflakes on a file and return list of issues with line numbers.
    
    Args:
        file_path: Path to the Python file to check
        
    Returns:
        List of dicts with keys: line_number, issue_type, message
    """
    issues = []
    
    try:
        file_path = Path(file_path)
        
        if not file_path.exists():
            return issues
        
        # Read the file
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()
        
        # Capture pyflakes output
        output_stream = io.StringIO()
        error_stream = io.StringIO()
        reporter = pyflakes.reporter.Reporter(output_stream, error_stream)
        
        # Run pyflakes check
        pyflakes.api.check(code, str(file_path), reporter)
        
        # Parse output
        output = output_stream.getvalue()
        
        # Extract issues from output
        # Format: filename:line:col: message
        pattern = r"(?:.*?):(\d+):(?:\d+):\s*(.*)"
        
        for line in output.split('\n'):
            if line.strip():
                match = re.search(pattern, line)
                if match:
                    line_num = int(match.group(1))
                    message = match.group(2).strip()
                    
                    # Classify issue type
                    issue_type = "LINTING"
                    if "imported but unused" in message:
                        issue_type = "LINTING"
                    elif "undefined name" in message:
                        issue_type = "IMPORT"
                    elif "redefinition" in message:
                        issue_type = "LOGIC"
                    
                    issues.append({
                        "line_number": line_num,
                        "issue_type": issue_type,
                        "message": message
                    })
        
        return issues
    
    except Exception as e:
        print(f"Error running pyflakes on {file_path}: {e}")
        return issues


def run_pytest(repo_path: str, test_files: List[str] = None) -> Dict[str, Any]:
    """
    Run pytest on test files and return parsed results.
    
    Args:
        repo_path: Path to the repository
        test_files: List of test file paths (relative to repo_path)
        
    Returns:
        Dict with keys: passed, failed, errors, output, summary
    """
    result = {
        "passed": 0,
        "failed": 0,
        "errors": 0,
        "output": "",
        "summary": "",
        "failures": []
    }
    
    try:
        repo_path = Path(repo_path)
        
        # Build pytest command
        cmd = ["pytest", "-v", "--tb=short"]
        
        if test_files:
            test_paths = [str(repo_path / f) for f in test_files]
            cmd.extend(test_paths)
        else:
            cmd.append(str(repo_path))
        
        # Run pytest
        process = subprocess.run(
            cmd,
            cwd=str(repo_path),
            capture_output=True,
            text=True,
            timeout=300
        )
        
        output = process.stdout + "\n" + process.stderr
        result["output"] = output
        
        # Parse output for summary
        if "passed" in output or "failed" in output:
            # Extract summary line
            summary_match = re.search(
                r"=+\s*(.*?)passed.*?=+|=+\s*(.*?)failed.*?=+",
                output,
                re.MULTILINE
            )
            if summary_match:
                result["summary"] = summary_match.group(0)
        
        # Count results
        result["passed"] = output.count(" PASSED")
        result["failed"] = output.count(" FAILED")
        result["errors"] = output.count(" ERROR")
        
        # Parse failures
        result["failures"] = parse_pytest_output(output)
        
        return result
    
    except subprocess.TimeoutExpired:
        result["errors"] = 1
        result["summary"] = "Pytest execution timeout"
        return result
    except Exception as e:
        result["errors"] = 1
        result["summary"] = f"Error running pytest: {str(e)}"
        print(f"Error running pytest: {e}")
        return result


def parse_pytest_output(output: str) -> List[Dict[str, Any]]:
    """
    Extract failures from pytest output with file, line, error type, error message.
    
    Args:
        output: Pytest output text
        
    Returns:
        List of dicts with keys: file, line_number, error_type, error_message
    """
    failures = []
    
    try:
        # Pattern to match FAILED lines
        # FAILED path/to/test.py::TestClass::test_method - error message
        failed_pattern = r"FAILED\s+([^\s]+(?::[^\s]+)?)\s*(?:-\s*(.*))?$"
        
        for line in output.split('\n'):
            if "FAILED" in line:
                match = re.search(failed_pattern, line)
                if match:
                    test_path = match.group(1)
                    error_msg = match.group(2) or "Unknown error"
                    
                    # Extract file and line number
                    file_match = re.search(r"([^:]+):(\d+)", test_path)
                    if file_match:
                        file_name = file_match.group(1)
                        line_num = int(file_match.group(2))
                    else:
                        file_name = test_path.split("::")[0]
                        line_num = 0
                    
                    # Detect bug type from error message
                    bug_type = detect_bug_type(error_msg)
                    
                    failures.append({
                        "file": file_name,
                        "line_number": line_num,
                        "error_type": bug_type,
                        "error_message": error_msg.strip()
                    })
        
        return failures
    
    except Exception as e:
        print(f"Error parsing pytest output: {e}")
        return failures


def detect_bug_type(error_message: str) -> str:
    """
    Classify error into bug type categories.
    
    Args:
        error_message: Error message string
        
    Returns:
        Bug type: LINTING, SYNTAX, LOGIC, TYPE_ERROR, IMPORT, INDENTATION
    """
    error_lower = error_message.lower()
    
    # Check for syntax errors
    if any(x in error_lower for x in ["syntaxerror", "invalid syntax", "unexpected"]):
        return "SYNTAX"
    
    # Check for type errors
    if any(x in error_lower for x in ["typeerror", "type mismatch", "expected", "got"]):
        return "TYPE_ERROR"
    
    # Check for import errors
    if any(x in error_lower for x in ["importerror", "modulenotfounderror", "no module", "cannot import"]):
        return "IMPORT"
    
    # Check for indentation errors
    if "indentation" in error_lower:
        return "INDENTATION"
    
    # Check for logic errors
    if any(x in error_lower for x in ["assert", "assertion", "comparison failed", "not equal"]):
        return "LOGIC"
    
    # Check for linting issues
    if any(x in error_lower for x in ["unused", "imported but", "undefined", "redefinition"]):
        return "LINTING"
    
    # Default to logic error
    return "LOGIC"


def generate_fix_prompt(
    file_content: str,
    error: Dict[str, Any],
    bug_type: str,
    line_number: int
) -> str:
    """
    Create a detailed prompt for Groq LLM to generate fixes.
    
    Args:
        file_content: Full content of the Python file
        error: Error details dict
        bug_type: Type of bug (LINTING, SYNTAX, etc.)
        line_number: Line number where error occurs
        
    Returns:
        Detailed prompt string for LLM
    """
    lines = file_content.split('\n')
    
    # Get context around the error (5 lines before and after)
    start_line = max(0, line_number - 6)
    end_line = min(len(lines), line_number + 5)
    
    context_lines = lines[start_line:end_line]
    context_with_numbers = '\n'.join(
        f"{start_line + i + 1:3d}: {line}"
        for i, line in enumerate(context_lines)
    )
    
    error_msg = error.get("error_message", "Unknown error")
    
    prompt = f"""You are an expert Python developer fixing a {bug_type} bug.

Error Type: {bug_type}
Error Message: {error_msg}
Error Location: Line {line_number}

Code Context:
```python
{context_with_numbers}
```

Fix Instructions:
1. Identify the {bug_type} bug on line {line_number}
2. Provide the corrected code for that specific line or affected lines
3. Return ONLY the fixed code snippet, no explanations
4. Ensure the fix is minimal and doesn't change unrelated code
5. Make sure the fixed code is syntactically correct

Provide the corrected code:"""
    
    return prompt


def apply_fix_to_file(file_path: str, original_content: str, fixed_content: str) -> bool:
    """
    Safely apply fix by replacing content in a file.
    
    Args:
        file_path: Path to the file to fix
        original_content: Original file content
        fixed_content: Fixed file content
        
    Returns:
        True if successful, False otherwise
    """
    try:
        file_path = Path(file_path)
        
        # Validate that we're modifying a Python file
        if not file_path.suffix == '.py':
            print(f"Warning: {file_path} is not a Python file")
            return False
        
        # Create backup
        backup_path = file_path.with_suffix('.py.bak')
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(original_content)
        
        # Apply fix
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        # Verify the file is valid Python
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                compile(f.read(), str(file_path), 'exec')
        except SyntaxError as e:
            # Restore backup if syntax error
            with open(backup_path, 'r', encoding='utf-8') as f:
                original = f.read()
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(original)
            
            print(f"Syntax error in fixed file, reverted: {e}")
            return False
        
        # Remove backup if successful
        backup_path.unlink()
        return True
    
    except Exception as e:
        print(f"Error applying fix to {file_path}: {e}")
        return False


def setup_github_auth(repo_path: str, github_token: str) -> bool:
    """
    Configure git with GitHub token for authentication.
    
    Args:
        repo_path: Path to the git repository
        github_token: GitHub personal access token
        
    Returns:
        True if successful, False otherwise
    """
    try:
        repo = git.Repo(repo_path)
        
        # Configure git user
        with repo.config_writer() as git_config:
            git_config.set_value("user", "name", "AI-Agent").release()
            git_config.set_value("user", "email", "ai-agent@transformers.dev").release()
        
        # Configure GitHub token in URL
        # Convert https://github.com/user/repo.git to 
        # https://x-access-token:TOKEN@github.com/user/repo.git
        origin_url = repo.remote("origin").url
        
        if "https://" in origin_url and github_token:
            # Extract host and path
            match = re.match(r"https://([^/]+)/(.*)", origin_url)
            if match:
                new_url = f"https://x-access-token:{github_token}@{match.group(1)}/{match.group(2)}"
                
                with repo.config_writer() as git_config:
                    git_config.set_value("remote", "origin", "url", new_url).release()
        
        return True
    
    except Exception as e:
        print(f"Error setting up GitHub auth: {e}")
        return False


def calculate_score(
    start_time: float,
    end_time: float,
    commit_count: int,
    all_tests_pass: bool
) -> Dict[str, Any]:
    """
    Calculate overall score with breakdown.
    
    Scoring:
    - Base: 100
    - Speed bonus: +10 if completed in under 5 minutes
    - Efficiency penalty: -2 per commit over 20
    - Test failure penalty: -30 if tests don't pass
    - Fix rate bonus: +20 if all fixes applied successfully
    
    Args:
        start_time: Start time in seconds (from time.time())
        end_time: End time in seconds (from time.time())
        commit_count: Number of commits made
        all_tests_pass: Whether all tests pass after fixes
        
    Returns:
        Dict with keys: base_score, speed_bonus, efficiency_penalty, 
                       final_score, time_taken_seconds
    """
    time_taken = end_time - start_time
    
    score_breakdown = {
        "base_score": 100,
        "speed_bonus": 0,
        "efficiency_penalty": 0,
        "test_penalty": 0,
        "fix_rate_bonus": 0,
        "final_score": 100,
        "time_taken_seconds": time_taken
    }
    
    # Speed bonus: under 5 minutes (300 seconds)
    if time_taken < 300:
        score_breakdown["speed_bonus"] = 10
    
    # Efficiency penalty: -2 per commit over 20
    if commit_count > 20:
        score_breakdown["efficiency_penalty"] = -2 * (commit_count - 20)
    
    # Test penalty: -30 if tests don't pass
    if not all_tests_pass:
        score_breakdown["test_penalty"] = -30
    else:
        # Fix rate bonus: +20 if all successful
        score_breakdown["fix_rate_bonus"] = 20
    
    # Calculate final score
    final = (
        score_breakdown["base_score"] +
        score_breakdown["speed_bonus"] +
        score_breakdown["efficiency_penalty"] +
        score_breakdown["test_penalty"] +
        score_breakdown["fix_rate_bonus"]
    )
    
    # Ensure score is between 0 and 100
    score_breakdown["final_score"] = max(0, min(100, final))
    
    return score_breakdown


def save_results(data: Dict[str, Any], output_path: str = None) -> bool:
    """
    Save results to results.json in the backend folder.
    
    Args:
        data: Results data dictionary
        output_path: Optional custom path for results file
        
    Returns:
        True if successful, False otherwise
    """
    try:
        if output_path is None:
            output_path = Path(__file__).parent / "results.json"
        else:
            output_path = Path(output_path)
        
        # Ensure the directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Add timestamp
        data["timestamp"] = datetime.now().isoformat()
        
        # Write JSON file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=str)
        
        print(f"Results saved to {output_path}")
        return True
    
    except Exception as e:
        print(f"Error saving results: {e}")
        return False


def format_duration(seconds: float) -> str:
    """
    Format duration in seconds to human-readable string.
    
    Args:
        seconds: Duration in seconds
        
    Returns:
        Formatted string like "1m 30s"
    """
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    
    if minutes > 0:
        return f"{minutes}m {secs}s"
    else:
        return f"{secs}s"


def get_file_summary(file_path: str) -> Dict[str, Any]:
    """
    Get summary statistics for a Python file.
    
    Args:
        file_path: Path to Python file
        
    Returns:
        Dict with keys: lines_of_code, functions, classes, imports
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        lines = content.split('\n')
        
        summary = {
            "lines_of_code": len([l for l in lines if l.strip() and not l.strip().startswith('#')]),
            "total_lines": len(lines),
            "functions": len(re.findall(r'^\s*def\s+\w+', content, re.MULTILINE)),
            "classes": len(re.findall(r'^\s*class\s+\w+', content, re.MULTILINE)),
            "imports": len(re.findall(r'^(?:import|from)\s+', content, re.MULTILINE))
        }
        
        return summary
    
    except Exception as e:
        print(f"Error getting file summary: {e}")
        return {}
