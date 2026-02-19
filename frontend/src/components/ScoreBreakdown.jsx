import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

export default function ScoreBreakdown({ results }) {
  if (!results) return null

  const baseScore = 100
  const speedBonus = results.speed_bonus || 0
  const efficiencyPenalty = results.efficiency_penalty || 0
  const testPenalty = results.test_penalty || 0
  const finalScore = results.score || 0

  const chartData = [
    { name: 'Base', value: baseScore, fill: '#06b6d4' },
    { name: 'Speed Bonus', value: Math.max(0, speedBonus), fill: '#10b981' },
    { name: 'Penalty', value: Math.abs(Math.min(0, efficiencyPenalty + testPenalty)), fill: '#ef4444' }
  ]

  const scorePercentage = (finalScore / 110) * 100

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-cyan-400">Score Breakdown</h2>

      {/* Score Display */}
      <div className="text-center mb-8 p-6 bg-gradient-to-r from-cyan-900 to-blue-900 rounded-lg border border-cyan-700">
        <p className="text-slate-300 text-sm mb-2">FINAL SCORE</p>
        <p className="text-6xl font-bold text-cyan-400 mb-2">{finalScore}</p>
        <p className="text-slate-400 text-xs">out of 110 max</p>
      </div>

      {/* Score Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Score Progress</span>
          <span className="text-sm font-semibold text-cyan-400">{scorePercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
            style={{ width: `${Math.min(scorePercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between p-3 bg-slate-700 rounded">
          <span className="text-slate-300">Base Score</span>
          <span className="font-semibold text-cyan-400">+{baseScore}</span>
        </div>

        {speedBonus > 0 && (
          <div className="flex justify-between p-3 bg-slate-700 rounded">
            <span className="text-slate-300">Speed Bonus (under 5 min)</span>
            <span className="font-semibold text-green-400">+{speedBonus}</span>
          </div>
        )}

        {efficiencyPenalty < 0 && (
          <div className="flex justify-between p-3 bg-slate-700 rounded">
            <span className="text-slate-300">Efficiency Penalty</span>
            <span className="font-semibold text-red-400">{efficiencyPenalty}</span>
          </div>
        )}

        {testPenalty < 0 && (
          <div className="flex justify-between p-3 bg-slate-700 rounded">
            <span className="text-slate-300">Test Failure Penalty</span>
            <span className="font-semibold text-red-400">{testPenalty}</span>
          </div>
        )}

        <div className="flex justify-between p-3 bg-gradient-to-r from-cyan-900 to-blue-900 rounded border border-cyan-600 font-bold">
          <span className="text-cyan-300">FINAL SCORE</span>
          <span className="text-cyan-400">{finalScore}</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '0.5rem'
            }}
            labelStyle={{ color: '#06b6d4' }}
          />
          <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
