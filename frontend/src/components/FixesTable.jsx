import React from 'react'

const bugTypeColors = {
  LINTING: 'bg-blue-900 text-blue-200',
  SYNTAX: 'bg-yellow-900 text-yellow-200',
  LOGIC: 'bg-purple-900 text-purple-200',
  TYPE_ERROR: 'bg-orange-900 text-orange-200',
  IMPORT: 'bg-cyan-900 text-cyan-200',
  INDENTATION: 'bg-pink-900 text-pink-200'
}

export default function FixesTable({ results }) {
  if (!results || !results.fixes || results.fixes.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-cyan-400">Applied Fixes</h2>
        <div className="text-center py-8 text-slate-400">
          No fixes applied
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-cyan-400">Applied Fixes</h2>
        <span className="px-3 py-1 bg-cyan-900 text-cyan-200 rounded-full font-bold text-sm">
          {results.fixes.length} fixes
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-700">
              <th className="px-4 py-3 text-left font-semibold text-slate-300">File</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Bug Type</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-300">Line</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Commit Message</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.fixes.map((fix, index) => (
              <tr
                key={index}
                className={`border-b border-slate-700 transition hover:bg-slate-700 ${
                  index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750'
                }`}
              >
                <td className="px-4 py-3 text-slate-300 font-mono text-xs truncate max-w-xs">
                  {fix.file || 'N/A'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    bugTypeColors[fix.bug_type] || 'bg-slate-700 text-slate-300'
                  }`}>
                    {fix.bug_type || 'UNKNOWN'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-slate-300 font-mono">
                  {fix.line_number || '-'}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-sm">
                  {fix.commit_message || 'N/A'}
                </td>
                <td className="px-4 py-3 text-center">
                  {fix.status === 'Fixed' || fix.status === 'fixed' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-900 text-green-200 rounded text-xs font-semibold">
                      ✓ Fixed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-900 text-red-200 rounded text-xs font-semibold">
                      ✗ Failed
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
