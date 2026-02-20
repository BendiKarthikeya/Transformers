import React from 'react'
import { useAgent } from '../context/AgentContext'
import InputSection from '../components/InputSection'
import RunSummaryCard from '../components/RunSummaryCard'
import ScoreBreakdown from '../components/ScoreBreakdown'
import FixesTable from '../components/FixesTable'
import CICDTimeline from '../components/CICDTimeline'
import { Link } from 'react-router-dom'
import RobotLogo from '../components/RobotLogo'

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
            <header className="sticky top-0 z-50 bg-slate-950/60 backdrop-blur-2xl border-b border-white/5 shadow-2xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-4 group transition-all hover:scale-[1.02] duration-500">
                            <RobotLogo className="w-12 h-12" />
                            <div>
                                <h1 className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 leading-none">
                                    TRANSFORMERS
                                </h1>
                                <p className="text-[10px] text-cyan-500 font-black tracking-[0.2em] uppercase mt-1">AI Healing Unit</p>
                            </div>
                        </Link>

                        <div className="flex items-center gap-6">
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operation Status</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                    <span className="text-xs font-bold text-slate-300">Active Node</span>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-slate-800 hidden md:block"></div>
                            <div className="hidden sm:block text-[10px] uppercase font-black tracking-widest bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400">
                                RIFT 2026
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
                    <div className="mb-10 p-6 md:p-12 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-800/50 flex flex-col items-center justify-center animate-pulse">
                        <div className="relative mb-8">
                            <div className="w-16 h-16 md:w-20 md:h-20 border-[6px] border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-2xl animate-pulse"></div>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-tight text-center">Agent Deployed</h3>
                        <p className="text-slate-400 text-base md:text-lg text-center">Analyzing repository structure and healing bugs...</p>
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
                    <div className="relative group py-20 px-6 text-center rounded-[40px] border border-white/5 bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        <div className="relative z-10">
                            <div className="flex justify-center mb-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
                                    <RobotLogo className="w-24 h-24 relative z-10 opacity-40 hover:opacity-100 transition-opacity duration-500" />
                                </div>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tighter italic uppercase">System Idle</h2>
                            <p className="text-slate-500 max-w-md mx-auto font-bold uppercase tracking-[0.2em] text-[10px]">
                                Awaiting mission coordinates. <br />
                                <span className="text-slate-700">Submit a repository URL to deploy autonomous healing sequence.</span>
                            </p>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800/30 mt-20 backdrop-blur-sm bg-slate-950/50 py-10">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-slate-600 text-xs mt-2">© 2026 TRANSFORMERS Team • RIFT Hackathon</p>
                </div>
            </footer>
        </div>
    )
}
