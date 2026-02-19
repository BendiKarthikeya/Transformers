import React from 'react'

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}m ${secs}s`
}

export default function RunSummaryCard({ results }) {
  if (!results) return null

  const ciStatus = results.ci_status === 'passed'

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-cyan-400">Run Summary</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Repository */}
        <div className="bg-slate-700 rounded p-4">
          <p className="text-slate-400 text-sm mb-1">Repository</p>
          <p className="text-white font-semibold truncate">{results.branch_name || 'N/A'}</p>
        </div>

        {/* Team Info */}
        <div className="bg-slate-700 rounded p-4">
          <p className="text-slate-400 text-sm mb-1">Team</p>
          <p className="text-white font-semibold">
            {(results.team_name || 'N/A') + ' • ' + (results.team_leader || 'N/A')}
          </p>
        </div>

        {/* Branch Created */}
        <div className="bg-slate-700 rounded p-4">
          <p className="text-slate-400 text-sm mb-1">Branch Created</p>
          <p className="text-cyan-400 font-semibold text-sm truncate">
            {results.branch_name || 'N/A'}
          </p>
        </div>

        {/* PR Created (if forked) */}
        {results.pr_url && (
          <div className="bg-slate-700 rounded p-4 lg:col-span-3">
            <p className="text-slate-400 text-sm mb-2">Pull Request</p>
            <a
              href={results.pr_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 font-semibold hover:text-green-300 break-all flex items-center gap-2"
            >
              <span>🔗 View PR</span>
              <span className="text-xs text-slate-400">→</span>
            </a>
          </div>
        )}

        {/* Fork Info (if applicable) */}
        {results.is_fork && (
          <div className="bg-slate-700 rounded p-4 lg:col-span-3">
            <p className="text-slate-400 text-sm mb-2">Fork Status</p>
            <div className="space-y-1">
              <p className="text-yellow-400 font-semibold text-sm">✓ Repository was forked</p>
              <p className="text-slate-400 text-xs">
                Original: <span className="text-cyan-300">{results.original_repo_url}</span>
              </p>
              {results.fork_url && (
                <p className="text-slate-400 text-xs">
                  Fork: <span className="text-cyan-300">{results.fork_url}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Failures & Fixes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-700 rounded">
            <span className="text-slate-300">Total Failures Detected</span>
            <span className="inline-flex items-center gap-2">
              <span className="px-3 py-1 bg-red-900 text-red-200 rounded-full font-bold text-sm">
                {results.total_failures || 0}
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-700 rounded">
            <span className="text-slate-300">Total Fixes Applied</span>
            <span className="inline-flex items-center gap-2">
              <span className="px-3 py-1 bg-green-900 text-green-200 rounded-full font-bold text-sm">
                {results.total_fixes || 0}
              </span>
            </span>
          </div>
        </div>

        {/* Status & Time */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-700 rounded">
            <span className="text-slate-300">CI/CD Status</span>
            <span className={`px-4 py-1 rounded-full font-bold text-lg ${
              ciStatus
                ? 'bg-green-900 text-green-200'
                : 'bg-red-900 text-red-200'
            }`}>
              {ciStatus ? '✅ PASSED' : '❌ FAILED'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-700 rounded">
            <span className="text-slate-300">Time Taken</span>
            <span className="text-cyan-400 font-semibold">
              {formatTime(results.time_taken || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
