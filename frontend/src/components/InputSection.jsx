import React, { useState } from 'react'
import { useAgent } from '../context/AgentContext'

export default function InputSection() {
  const { runAgent, isLoading, teamName: contextTeamName, leaderName: contextLeaderName } = useAgent()
  const [repoUrl, setRepoUrl] = useState('')
  const [teamName, setTeamName] = useState('')
  const [leaderName, setLeaderName] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')

    if (!repoUrl.trim()) {
      setLocalError('Repository URL is required')
      return
    }

    if (!repoUrl.includes('github.com')) {
      setLocalError('Please enter a valid GitHub repository URL')
      return
    }

    if (!teamName.trim()) {
      setLocalError('Team name is required')
      return
    }

    if (!leaderName.trim()) {
      setLocalError('Team leader name is required')
      return
    }

    await runAgent(repoUrl, teamName, leaderName)
    setRepoUrl('')
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-cyan-400">Repository Analysis</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            GitHub Repository URL
          </label>
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Team Name
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="TRANSFORMERS"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Team Leader Name
            </label>
            <input
              type="text"
              value={leaderName}
              onChange={(e) => setLeaderName(e.target.value)}
              placeholder="KARTHIKEYA"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              disabled={isLoading}
            />
          </div>
        </div>

        {localError && (
          <div className="p-3 bg-red-950 border border-red-800 rounded text-red-200 text-sm">
            {localError}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition duration-200 flex items-center justify-center gap-2 text-lg"
        >
          {isLoading ? (
            <>
              <span className="inline-block animate-spin">⏳</span>
              Running Agent...
            </>
          ) : (
            <>
              🚀 Run Agent
            </>
          )}
        </button>
      </form>
    </div>
  )
}
