import React from 'react'

export default function FixesTable({ results }) {
  if (!results || !results.fixes || results.fixes.length === 0) return null

  return (
    <div className="relative group p-px rounded-3xl bg-slate-800/50 hover:bg-gradient-to-br hover:from-cyan-500/20 hover:to-blue-500/20 transition-all duration-500 shadow-2xl">
      <div className="relative overflow-hidden rounded-[22px] bg-slate-950/80 backdrop-blur-xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shadow-inner">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white uppercase italic">Resolution Directory</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Applied Code Rectifications</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-slate-900/50 border border-slate-800 rounded-lg">
            <span className="text-[10px] font-black text-slate-400">{results.fixes.length} ENTRIES</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800/30">
                <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Target File</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Defect Class</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/20">
              {results.fixes.map((fix, index) => (
                <tr key={index} className="group/row hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-200 group-hover/row:text-cyan-400 transition-colors truncate max-w-[200px] md:max-w-md">
                        {fix.file}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono mt-0.5">Line {fix.line_number || '??'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-center md:text-left">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      {fix.bug_type || 'GENERAL'}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-center">
                    {fix.status?.toLowerCase() === 'fixed' ? (
                      <div className="flex items-center justify-center gap-1.5 text-green-500">
                        <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Resolved</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 text-red-500">
                        <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Rejected</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
