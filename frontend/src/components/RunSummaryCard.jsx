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
    <div className="relative group p-px rounded-3xl bg-slate-800/50 hover:bg-gradient-to-br hover:from-cyan-500/20 hover:to-blue-500/20 transition-all duration-500 shadow-2xl">
      <div className="relative overflow-hidden rounded-[22px] bg-slate-950/80 backdrop-blur-xl p-6 md:p-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${ciStatus ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'} border shadow-inner`}>
              {ciStatus ? (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">Operation Summary</h2>
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${ciStatus ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {ciStatus ? 'Stable' : 'Unstable'}
                </span>
                {results.time_taken && (
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-800 text-slate-300 border border-slate-700">
                    {formatTime(results.time_taken)}
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm font-medium mt-1">ID: <span className="font-mono">{results.repo_url?.split('/').pop() || 'N/A'}</span> • {results.project_type?.toUpperCase() || 'CORE'} ENGINE</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-5 py-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Health Score</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-black ${results.score > 80 ? 'text-green-400' : results.score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>{results.score || 0}</span>
                <span className="text-slate-600 text-xs font-bold">/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card: Failures */}
          <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5 hover:border-red-500/20 transition-colors group/stat">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-red-500/10 text-red-400 rounded-lg group-hover/stat:bg-red-500/20 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-3xl font-black text-white">{results.total_failures || 0}</span>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Failures</p>
            <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (results.total_failures || 0) * 10)}%` }}></div>
            </div>
          </div>

          {/* Card: Fixes */}
          <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5 hover:border-green-500/20 transition-colors group/stat">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-500/10 text-green-400 rounded-lg group-hover/stat:bg-green-500/20 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-3xl font-black text-white">{results.total_fixes || 0}</span>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Fixes Applied</p>
            <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (results.total_fixes || 0) * 10)}%` }}></div>
            </div>
          </div>

          {/* Card: Fix Rounds */}
          <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5 hover:border-blue-500/20 transition-colors group/stat">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover/stat:bg-blue-500/20 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <span className="text-3xl font-black text-white">{results.fix_round || 0}</span>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Intelligence Rounds</p>
            <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (results.fix_round || 0) * 33)}%` }}></div>
            </div>
          </div>

          {/* Card: Results Link */}
          <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5 hover:border-purple-500/20 transition-colors flex flex-col justify-between group/stat">
            {results.pr_url ? (
              <a href={results.pr_url} target="_blank" rel="noreferrer" className="flex flex-col h-full group/link">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg group-hover/link:bg-purple-500/20 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                  <svg className="w-4 h-4 text-slate-700 group-hover/link:text-purple-400 transition-transform group-hover/link:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-auto">Production PR Released</p>
              </a>
            ) : (
              <div className="flex flex-col h-full opacity-40">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-slate-800 text-slate-500 rounded-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                </div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-auto">Direct Repo Patch</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {/* Repository Info */}
          <div className="bg-slate-900/20 border border-slate-800/40 rounded-2xl p-5">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Target Repository
            </p>
            <p className="text-slate-200 font-bold truncate text-xs font-mono">
              {results.repo_url
                ? results.repo_url.replace('https://github.com/', '')
                : results.branch_name || 'N/A'}
            </p>
          </div>

          {/* Team Info */}
          <div className="bg-slate-900/20 border border-slate-800/40 rounded-2xl p-5">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Operation Team
            </p>
            <p className="text-slate-200 font-bold text-xs uppercase tracking-tight">
              {results.team_name || 'N/A'} <span className="text-slate-600 mx-2">•</span> <span className="text-cyan-500">{results.team_leader || 'N/A'}</span>
            </p>
          </div>

          {/* Branch Created */}
          <div className="bg-slate-900/20 border border-slate-800/40 rounded-2xl p-5">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              Active Branch
            </p>
            <p className="text-cyan-400 font-bold text-xs font-mono truncate">
              {results.branch_name || 'master'}
            </p>
          </div>
        </div>

        {/* Fork Warning/Info */}
        {results.is_fork && (
          <div className="mt-6 flex items-center gap-4 p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-cyan-500 mb-1">External Repository Detected</p>
              <p className="text-slate-400 text-[10px] font-medium leading-relaxed">Agent has successfully created a workspace fork. Fixes are staged for cross-repo submission from <span className="text-slate-200 font-mono">{results.original_repo_url?.replace('https://github.com/', '')}</span>.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
