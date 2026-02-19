import os
import requests

github_token = os.getenv("GITHUB_TOKEN")
if not github_token:
    raise RuntimeError("GITHUB_TOKEN is not set")

headers = {"Authorization": f"token {github_token}"}
response = requests.get(
    "https://api.github.com/repos/BendiKarthikeya/test-repo/branches",
    headers=headers
)

if response.status_code == 200:
    branches = response.json()
    ai_branches = [b for b in branches if "TRANSFORMERS" in b["name"] or "AI_Fix" in b["name"]]
    print(f"Found {len(branches)} total branches")
    print(f"AI-related branches: {len(ai_branches)}")
    for branch in ai_branches:
        commit_sha = branch["commit"]["sha"][:8]
        branch_name = branch["name"]
        print(f"  - {branch_name}: {commit_sha}")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
