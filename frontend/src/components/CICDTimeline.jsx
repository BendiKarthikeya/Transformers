import React from 'react'

export default function CICDTimeline({ results }) {
  if (!results || !results.timeline || results.timeline.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-cyan-400">CI/CD Timeline</h2>
        <div className="text-center py-8 text-slate-400">
          No timeline data available
        </div>
      </div>
    )
  }

  const timeline = results.timeline || []
  const passedCount = timeline.filter(e => e.status === 'passed' || e.status === 'completed').length
  const failedCount = timeline.filter(e => e.status === 'failed').length
  const totalRuns = Math.max(5, passedCount + failedCount)

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">CI/CD Timeline</h2>

      {/* Progress */}
      <div className="mb-6 p-4 bg-slate-700 rounded">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-300 font-semibold">Iterations Progress</span>
          <span className="text-sm text-slate-400">
            {passedCount + failedCount}/5 iterations used
          </span>
        </div>
        <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
            style={{ width: `${((passedCount + failedCount) / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {timeline.map((event, index) => {
          const isPassed = event.status === 'passed' || event.status === 'completed'
          const isFailed = event.status === 'failed'

          return (
            <div key={index} className="flex gap-4 p-3 bg-slate-700 rounded hover:bg-slate-600 transition">
              {/* Timeline Dot */}
              <div className="flex flex-col items-center pt-1">
                <div className={`w-3 h-3 rounded-full ${
                  isPassed
                    ? 'bg-green-500 shadow-lg shadow-green-500/50'
                    : isFailed
                    ? 'bg-red-500 shadow-lg shadow-red-500/50'
                    : 'bg-cyan-500 shadow-lg shadow-cyan-500/50'
                }`} />
                {index < timeline.length - 1 && (
                  <div className={`w-0.5 h-12 ${
                    isPassed ? 'bg-green-500/30' : isFailed ? 'bg-red-500/30' : 'bg-slate-600'
                  }`} />
                )}
              </div>

              {/* Timeline Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-white capitalize truncate">
                    {event.stage || `Run #${index + 1}`}
                  </h3>
                  {isPassed && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-900 text-green-200 rounded text-xs font-semibold whitespace-nowrap ml-2">
                      ✓ PASSED
                    </span>
                  )}
                  {isFailed && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-900 text-red-200 rounded text-xs font-semibold whitespace-nowrap ml-2">
                      ✗ FAILED
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm mb-1 truncate">
                  {event.description || 'No description'}
                </p>
                <p className="text-slate-500 text-xs">
                  {event.timestamp && new Date(event.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-700">
        <div className="text-center p-2 bg-green-900/20 rounded border border-green-800/50">
          <p className="text-green-400 text-lg font-bold">{passedCount}</p>
          <p className="text-green-300 text-xs">Passed</p>
        </div>
        <div className="text-center p-2 bg-red-900/20 rounded border border-red-800/50">
          <p className="text-red-400 text-lg font-bold">{failedCount}</p>
          <p className="text-red-300 text-xs">Failed</p>
        </div>
      </div>
    </div>
  )
}
