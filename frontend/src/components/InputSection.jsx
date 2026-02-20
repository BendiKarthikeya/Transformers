import React, { useState } from 'react'
import { useAgent } from '../context/AgentContext'

export default function InputSection() {
  const { runAgent, isLoading } = useAgent()
  const [repoUrl, setRepoUrl] = useState('')
  const [teamName, setTeamName] = useState('TRANSFORMERS')
  const [leaderName, setLeaderName] = useState('KARTHIKEYA')
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
    // Don't clear team/leader, only repo
    setRepoUrl('')
  }

  return (
    <div className="relative group p-px rounded-3xl bg-gradient-to-br from-slate-700/50 via-slate-800/50 to-slate-900/50 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-500 shadow-2xl overflow-hidden">
      <div className="relative overflow-hidden rounded-[22px] bg-slate-950/90 backdrop-blur-2xl p-6 md:p-10">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 -m-20 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] group-hover:bg-cyan-500/10 transition-colors duration-700"></div>
        <div className="absolute bottom-0 left-0 -m-20 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] group-hover:bg-blue-500/10 transition-colors duration-700"></div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                  Mission Initialization
                </span>
              </h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">Configure and deploy your autonomous healing agent</p>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Terminal Active</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
                <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Source Repository
              </label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within/input:text-cyan-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/Transformers/Core-Engine"
                  className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all shadow-inner font-mono text-sm"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Squad Designation
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="TRANSFORMERS"
                  className="w-full px-5 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner font-bold tracking-wide"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
                  <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Squad Leader
                </label>
                <input
                  type="text"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  placeholder="KARTHIKEYA"
                  className="w-full px-5 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all shadow-inner font-bold tracking-wide"
                  disabled={isLoading}
                />
              </div>
            </div>

            {localError && (
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-300 text-xs font-bold flex items-center gap-3 animate-shake">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {localError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group/btn h-16 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 p-px hover:shadow-[0_0_40px_-10px_rgba(6,182,212,0.5)] transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="relative h-full w-full bg-slate-950/20 group-hover/btn:bg-transparent transition-colors flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-white font-black uppercase tracking-widest text-sm">Deploying Intelligence...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-white font-black uppercase tracking-widest text-sm">Initialize Auto-Healing</span>
                  </>
                )}
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
