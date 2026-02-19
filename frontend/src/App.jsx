import React from 'react'
import { AgentProvider, useAgent } from './context/AgentContext'
import InputSection from './components/InputSection'
import RunSummaryCard from './components/RunSummaryCard'
import ScoreBreakdown from './components/ScoreBreakdown'
import FixesTable from './components/FixesTable'
import CICDTimeline from './components/CICDTimeline'

function AppContent() {
  const { isLoading, results, error } = useAgent()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">🤖 TRANSFORMERS CI/CD Healing Agent</h1>
            </div>
            <div className="text-sm text-slate-400">
              Leader: <span className="font-semibold text-cyan-400">KARTHIKEYA</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Section */}
        <section className="mb-8">
          <InputSection />
        </section>

        {/* Loading State */}
        {isLoading && (
          <div className="mb-8 p-8 bg-slate-800 rounded-lg border border-slate-700 flex flex-col items-center justify-center">
            <div className="animate-spin mb-4">
              <div className="w-12 h-12 border-4 border-slate-600 border-t-cyan-400 rounded-full"></div>
            </div>
            <p className="text-lg text-slate-300">Analyzing repository and running agent...</p>
            <p className="text-sm text-slate-400 mt-2">This may take a few moments</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="mb-8 p-4 bg-red-950 border border-red-800 rounded-lg">
            <p className="text-red-200 font-semibold">❌ Error</p>
            <p className="text-red-100 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Results */}
        {results && !isLoading && (
          <div className="space-y-6">
            {/* Summary Card */}
            <RunSummaryCard results={results} />

            {/* Score and Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScoreBreakdown results={results} />
              <CICDTimeline results={results} />
            </div>

            {/* Fixes Table */}
            <FixesTable results={results} />
          </div>
        )}

        {/* Empty State */}
        {!results && !isLoading && !error && (
          <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-lg">Enter a repository URL and click "Run Agent" to begin</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-slate-400 text-sm">
          <p>🚀 Autonomous CI/CD Healing Agent • Powered by Groq AI</p>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <AgentProvider>
      <AppContent />
    </AgentProvider>
  )
}
