import React from 'react'
import { useAgent } from '../context/AgentContext'
import InputSection from '../components/InputSection'
import RunSummaryCard from '../components/RunSummaryCard'
import ScoreBreakdown from '../components/ScoreBreakdown'
import FixesTable from '../components/FixesTable'
import CICDTimeline from '../components/CICDTimeline'
import { Link } from 'react-router-dom'

export default function Dashboard() {
    const { isLoading, results, error } = useAgent()

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500 selection:text-white">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[100px]"></div>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-3 group transition-transform hover:scale-105 duration-300">
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-cyan-500/50 transition-all">
                                <span className="text-white font-bold text-xl">T</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                                    TRANSFORMERS
                                </h1>
                                <p className="text-xs text-cyan-500 font-medium tracking-wide">CI/CD HEALING AGENT</p>
                            </div>
                        </Link>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:block text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                RIFT 2026 Hackathon
                            </div>
                            <div className="px-4 py-1.5 bg-slate-900 border border-slate-700/50 rounded-full flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-sm text-slate-300">System Online</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">

                {/* Input Section */}
                <section className="mb-10">
                    <InputSection />
                </section>

                {/* Loading State */}
                {isLoading && (
                    <div className="mb-10 p-12 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-800/50 flex flex-col items-center justify-center animate-pulse">
                        <div className="relative mb-8">
                            <div className="w-20 h-20 border-[6px] border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-2xl animate-pulse"></div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Agent Deployed</h3>
                        <p className="text-slate-400 text-lg">Analyzing repository structure and healing bugs...</p>
                        <div className="mt-6 flex gap-2">
                            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-100"></span>
                            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="mb-10 p-6 bg-red-950/20 border border-red-500/30 rounded-2xl backdrop-blur-sm animate-shake flex items-center gap-5">
                        <div className="p-4 bg-red-500/10 rounded-full shrink-0">
                            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-red-200 font-bold text-lg mb-1">Execution Failed</h3>
                            <p className="text-red-300/70">{error}</p>
                        </div>
                    </div>
                )}

                {/* Results */}
                {results && !isLoading && (
                    <div className="space-y-8 animate-slide-up">
                        {/* Summary Card */}
                        <RunSummaryCard results={results} />

                        {/* Score and Breakdown */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <ScoreBreakdown results={results} />
                            <CICDTimeline results={results} />
                        </div>

                        {/* Fixes Table */}
                        <FixesTable results={results} />
                    </div>
                )}

                {/* Empty State */}
                {!results && !isLoading && !error && (
                    <div className="py-24 text-center rounded-3xl border-2 border-dashed border-slate-800/50 bg-slate-900/20 backdrop-blur-sm">
                        <div className="text-7xl mb-6 opacity-30 blur-sm hover:blur-none transition-all duration-500 cursor-default">⚡</div>
                        <h2 className="text-2xl font-bold text-slate-300 mb-2">Ready to Initialize</h2>
                        <p className="text-slate-500 max-w-md mx-auto">Enter a GitHub repository URL above to launch the autonomous agent.</p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800/30 mt-20 backdrop-blur-sm bg-slate-950/50 py-10">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-slate-500 text-sm font-medium">Powered by Groq Llama-3 • LangGraph • React</p>
                    <p className="text-slate-600 text-xs mt-2">© 2026 TRANSFORMERS Team • RIFT Hackathon</p>
                </div>
            </footer>
        </div>
    )
}
