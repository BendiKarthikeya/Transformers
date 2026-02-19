import asyncio
from agent import run_healing_agent
import json

async def main():
    print("Running healing agent...")
    res = await run_healing_agent("https://github.com/kalyanram360/buddymatcher_node")
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
