"""
Main FastAPI application for the Autonomous CI/CD Healing Agent.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()  # MUST be before agent import so env vars are set when HealingAgent() is instantiated

import os
import json
import time
import asyncio
from datetime import datetime
from pathlib import Path

from agent import run_healing_agent

app = FastAPI(
    title="Autonomous CI/CD Healing Agent",
    description="AI-powered agent for diagnosing and fixing CI/CD pipeline failures",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JSON file for storing results
RESULTS_DIR = Path(__file__).parent / "results"
RESULTS_FILE = RESULTS_DIR / "results.json"


class RunAgentRequest(BaseModel):
    """Request model for running the healing agent."""
    repo_url: str
    team_name: str = "TRANSFORMERS"
    team_leader: str = "KARTHIKEYA"


class RunAgentResponse(BaseModel):
    """Response model for agent execution."""
    branch_name: str
    total_failures: int
    total_fixes: int
    ci_status: str
    time_taken: float
    score: int
    fixes: list
    commits: list = []
    timeline: list
    is_fork: bool
    original_repo_url: str = None
    fork_url: str = None
    pr_url: str = None
    fix_round: int = 0
    project_type: str = "python"


def save_results(results: dict) -> None:
    """Save results to JSON file."""
    try:
        RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        with open(RESULTS_FILE, 'w') as f:
            json.dump(results, f, indent=2)
    except Exception as e:
        print(f"Error saving results: {e}")


def load_results() -> dict:
    """Load results from JSON file."""
    if not RESULTS_FILE.exists():
        return {
            "branch_name": "",
            "total_failures": 0,
            "total_fixes": 0,
            "ci_status": "unknown",
            "time_taken": 0,
            "score": 0,
            "fixes": [],
            "timeline": [],
            "last_updated": None
        }
    
    try:
        with open(RESULTS_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading results: {e}")
        return {
            "branch_name": "",
            "total_failures": 0,
            "total_fixes": 0,
            "ci_status": "unknown",
            "time_taken": 0,
            "score": 0,
            "fixes": [],
            "timeline": [],
            "last_updated": None
        }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/api/status")
async def get_status():
    """Check if server is running."""
    return {
        "status": "running",
        "service": "Autonomous CI/CD Healing Agent",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }


@app.get("/api/results")
async def get_results():
    """Return the latest results.json content."""
    results = load_results()
    return results


@app.post("/api/run-agent")
async def run_agent(request: RunAgentRequest):
    """
    Run the autonomous CI/CD healing agent on a repository.
    
    Args:
        request: RunAgentRequest with repo_url, team_name, team_leader
        
    Returns:
        RunAgentResponse with results
    """
    try:
        # Validate inputs
        if not request.repo_url:
            raise HTTPException(status_code=400, detail="repo_url is required")
        
        # Record start time
        start_time = time.time()
        
        # Add timeline entry
        timeline = []
        timeline.append({
            "stage": "initialization",
            "description": f"Starting CI/CD healing for {request.repo_url}",
            "status": "started",
            "timestamp": datetime.now().isoformat()
        })
        
        # Run the agent
        print(f"Running healing agent for repo: {request.repo_url}")
        agent_results = await run_healing_agent(
            repo_url=request.repo_url,
            team_name=request.team_name,
            team_leader=request.team_leader
        )
        
        # Calculate execution time
        time_taken = time.time() - start_time
        
        # Prepare response
        response_data = {
            "repo_url": request.repo_url,
            "team_name": request.team_name,
            "team_leader": request.team_leader,
            "branch_name": agent_results.get("branch_name", f"{request.team_name}_{request.team_leader}_AI_Fix"),
            "total_failures": agent_results.get("total_failures", 0),
            "total_fixes": agent_results.get("total_fixes", 0),
            "ci_status": agent_results.get("ci_status", "unknown"),
            "time_taken": time_taken,
            "score": agent_results.get("score", 0),
            "fixes": agent_results.get("fixes", []),
            "commits": agent_results.get("commits", []),
            "timeline": agent_results.get("timeline", timeline),
            "is_fork": agent_results.get("is_fork", False),
            "original_repo_url": agent_results.get("original_repo_url"),
            "fork_url": agent_results.get("fork_url"),
            "pr_url": agent_results.get("pr_url"),
            "fix_round": agent_results.get("fix_round", 0),
            "project_type": agent_results.get("project_type", "python")
        }
        
        # Add final timeline entry
        response_data["timeline"].append({
            "stage": "completion",
            "description": f"CI/CD healing completed in {time_taken:.2f} seconds",
            "status": response_data["ci_status"],
            "timestamp": datetime.now().isoformat()
        })
        
        # Save results
        response_data["last_updated"] = datetime.now().isoformat()
        save_results(response_data)
        
        return JSONResponse(
            status_code=200,
            content=response_data
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error running agent: {e}")
        error_response = {
            "branch_name": "",
            "total_failures": 0,
            "total_fixes": 0,
            "ci_status": "failed",
            "time_taken": 0,
            "score": 0,
            "fixes": [],
            "timeline": [
                {
                    "stage": "error",
                    "description": str(e),
                    "status": "failed",
                    "timestamp": datetime.now().isoformat()
                }
            ],
            "last_updated": datetime.now().isoformat(),
            "error": str(e)
        }
        save_results(error_response)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
