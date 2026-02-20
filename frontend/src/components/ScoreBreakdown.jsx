import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function ScoreBreakdown({ results }) {
  if (!results) return null

  const chartData = [
    { name: 'Logic', score: results.logic_integrity || 85, color: '#06b6d4' },
    { name: 'Stability', score: results.code_stability || 90, color: '#3b82f6' },
  ]

  return (
    <div className="relative group p-px rounded-3xl bg-slate-800/50 hover:bg-gradient-to-br hover:from-cyan-500/20 hover:to-blue-500/20 transition-all duration-500 shadow-2xl h-full">
      <div className="relative overflow-hidden rounded-[22px] bg-slate-950/80 backdrop-blur-xl p-6 md:p-8 h-full flex flex-col">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 shadow-inner">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white uppercase italic">Intelligence Metrics</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Automated Performance Analysis</p>
            </div>
          </div>

          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className={`${results.score > 80 ? 'text-green-500' : 'text-cyan-500'}`} strokeDasharray={176} strokeDashoffset={176 - (176 * results.score) / 100} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">{results.score}%</div>
          </div>
        </div>

        <div className="flex-1 space-y-8">
          {/* Chart */}
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} dy={10} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/40 border border-slate-800/50 rounded-2xl group/item hover:border-cyan-500/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover/item:text-cyan-500 transition-colors">Logic Integrity</span>
                <svg className="w-3 h-3 text-cyan-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white">{chartData[0].score}</span>
                <span className="text-[10px] text-slate-600 font-bold">%</span>
              </div>
              <div className="mt-2 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full" style={{ width: `${chartData[0].score}%` }}></div>
              </div>
            </div>

            <div className="p-4 bg-slate-900/40 border border-slate-800/50 rounded-2xl group/item hover:border-blue-500/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover/item:text-blue-500 transition-colors">Code Stability</span>
                <svg className="w-3 h-3 text-blue-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white">{chartData[1].score || 0}</span>
                <span className="text-[10px] text-slate-600 font-bold">%</span>
              </div>
              <div className="mt-2 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: `${chartData[1].score || 0}%` }}></div>
              </div>
            </div>

            <div className="p-4 bg-slate-900/40 border border-slate-800/50 rounded-2xl group/item hover:border-purple-500/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover/item:text-purple-500 transition-colors">Type Security</span>
                <svg className="w-3 h-3 text-purple-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-3.44A20.94 20.94 0 005.659 13m0 0c1.328.021 2.614.21 3.84.554m-3.84-.554l.012-.012M4.25 17.5l6.75-6.75M4.25 17.5a2.25 2.25 0 013.182-3.182l.012.012" />
                </svg>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white">100</span>
                <span className="text-[10px] text-slate-600 font-bold">%</span>
              </div>
              <div className="mt-2 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="p-4 bg-slate-900/40 border border-slate-800/50 rounded-2xl group/item hover:border-green-500/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover/item:text-green-500 transition-colors">CI Efficiency</span>
                <svg className="w-3 h-3 text-green-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white">{results.score}</span>
                <span className="text-[10px] text-slate-600 font-bold">%</span>
              </div>
              <div className="mt-2 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full" style={{ width: `${results.score}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Final Remark */}
        <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5">
          <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
            <span className="text-cyan-500 font-bold mr-1 italic underline">SYSTEM DATA:</span>
            Repository health is optimized based on automated intelligence analysis. Scoring is calculated using logic density and healing rate.
          </p>
        </div>
      </div>
    </div>
  )
}
