import React, { useState, useEffect } from 'react'

export default function CICDTimeline({ results }) {
  if (!results) return null

  const [activeTab, setActiveTab] = useState('pipeline') // 'pipeline' or 'logs'

  const steps = [
    {
      label: 'Intelligence Initialization', key: 'cloning', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )
    },
    {
      label: 'Environment Synchronization', key: 'env_setup', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      label: 'Defect Detection Scan', key: 'initial_test', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      label: 'Neural Resolution Sequence', key: 'fixing', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      label: 'Production Validation', key: 'final_test', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Protocol Finalization', key: 'complete', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    }
  ]

  const getStatus = (key) => {
    if (!results.timeline) return 'pending'
    // Fallback if the backend timeline names don't exactly match keys
    const found = results.timeline.find(t => t.stage.toLowerCase().includes(key.toLowerCase()))
    if (found) return found.status
    return 'pending'
  }

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch (e) {
      return '--:--:--'
    }
  }

  return (
    <div className="relative group p-px rounded-3xl bg-slate-800/50 hover:bg-gradient-to-br hover:from-cyan-500/20 hover:to-blue-500/20 transition-all duration-500 shadow-2xl">
      <div className="relative overflow-hidden rounded-[22px] bg-slate-950/80 backdrop-blur-xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 shadow-inner">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white uppercase italic">Execution Timeline</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Sequential Intelligence Pipeline</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pipeline' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-white'}`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-white'}`}
            >
              Tactical Logs
            </button>
          </div>
        </div>

        {activeTab === 'pipeline' ? (
          <div className="animate-fade-in space-y-10">
            <div className="relative space-y-8">
              {/* Progress Line */}
              <div className="absolute left-6 top-2 bottom-2 w-px bg-slate-800"></div>

              {steps.map((step, index) => {
                const status = getStatus(step.key)
                const isActive = status === 'active' || status === 'started'
                const isCompleted = status === 'completed' || status === 'passed' || status === 'success'
                const isFailed = status === 'failed'

                return (
                  <div key={index} className="relative z-10 flex items-center gap-6 group/step">
                    <div className={`
                      w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-500
                      ${isActive ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]' :
                        isCompleted ? 'bg-green-500/10 border-green-500/50 text-green-400' :
                          isFailed ? 'bg-red-500/10 border-red-500/50 text-red-500' :
                            'bg-slate-900 border-slate-800 text-slate-700'}
                    `}>
                      {isCompleted ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isFailed ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : step.icon}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-black uppercase tracking-tight transition-colors ${isActive ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-600'}`}>
                          {step.label}
                        </h3>
                        {isActive && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-cyan-400' : isCompleted ? 'text-green-500' : isFailed ? 'text-red-500' : 'text-slate-700'}`}>
                          {isActive ? 'Processing...' : isCompleted ? 'Verification Success' : isFailed ? 'Critical Failure' : 'Awaiting Task'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Sub-Timeline Feed */}
            <div className="mt-8 p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/30"></div>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Mission Feed</span>
              </div>
              <div className="space-y-2">
                {results.timeline && results.timeline.slice(-3).map((t, i) => (
                  <div key={i} className="flex gap-3 text-[10px] animate-slide-in">
                    <span className="text-slate-600 font-bold">[{formatTime(t.timestamp)}]</span>
                    <span className="text-cyan-500 font-bold uppercase">[{t.stage}]</span>
                    <span className="text-slate-400 font-medium truncate italic">{t.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[10px] h-[360px] overflow-y-auto animate-fade-in custom-scrollbar">
            <div className="space-y-4">
              {results.timeline && results.timeline.map((entry, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_auto] gap-x-4 items-start border-l-2 border-slate-800 pl-4 py-1 hover:border-cyan-500 transition-colors group/log">
                  <span className="text-slate-600 font-black whitespace-nowrap">[{formatTime(entry.timestamp)}]</span>
                  <div className="flex-1">
                    <span className="text-cyan-500 font-black uppercase mr-2 italic tracking-tighter">[{entry.stage}]</span>
                    <span className={`font-black uppercase tracking-tighter mr-2 ${entry.status === 'completed' || entry.status === 'success' ? 'text-green-500' : entry.status === 'failed' ? 'text-red-500' : 'text-yellow-500'}`}>
                      {entry.status}
                    </span>
                    <p className="text-slate-400 mt-1 font-medium group-hover/log:text-slate-200 transition-colors uppercase tracking-tight">
                      {entry.description}
                    </p>
                  </div>
                </div>
              ))}
              <div className="flex gap-4 text-cyan-500/50 animate-pulse">
                <span>[--:--:--]</span>
                <span className="font-black italic">AWAITING SYSTEM INTERRUPT...</span>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Warning Message */}
        {results.timeline && results.timeline.some(s => s.status === 'failed') && (
          <div className="mt-10 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold uppercase tracking-tight">
              <span className="text-red-500 font-bold block mb-0.5">Interrupt Detected</span>
              System encountered a pipeline friction. Autonomous recovery sequence is attempting to maintain operational continuity.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
