import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import RobotLogo from '../components/RobotLogo'

export default function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500 selection:text-white overflow-x-hidden relative">

            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[80%] md:w-[40%] h-[40%] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[80%] md:w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
                <div className="absolute top-[40%] left-[40%] w-[60%] md:w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-2000"></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-8 max-w-7xl mx-auto">
                <div className="flex items-center gap-4">
                    <RobotLogo className="w-12 h-12" />
                    <span className="text-xl md:text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">TRANSFORMERS</span>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-10 text-[10px] uppercase font-black tracking-widest text-slate-500">
                    <a href="#features" className="hover:text-cyan-400 transition-colors">Tactical Features</a>
                    <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">Deployment Protocol</a>
                    <Link
                        to="/dashboard"
                        className="px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-cyan-500 hover:text-slate-950 hover:border-cyan-500 transition-all backdrop-blur-md text-white font-black"
                    >
                        Launch Console
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 lg:pt-32 lg:pb-32 flex flex-col items-center text-center">
                <div className="mb-12 animate-fade-in flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full"></div>
                        <RobotLogo className="w-40 h-40 relative z-10" />
                    </div>
                </div>

                <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-200 to-slate-500 animate-fade-in-up delay-100 leading-[0.9]">
                    AUTONOMOUS <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">HEALING INTELLIGENCE</span>
                </h1>

                <p className="text-sm md:text-lg text-slate-500 max-w-2xl mb-12 font-bold uppercase tracking-widest animate-fade-in-up delay-200 px-4">
                    Automated repair sequence for mission-critical pipelines.
                    Detect. Diagnose. Rectify.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto px-6 sm:px-0 animate-fade-in-up delay-300">
                    <Link
                        to="/dashboard"
                        className="group relative px-10 py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_40px_-5px_rgba(6,182,212,0.4)] hover:shadow-[0_0_60px_-10px_rgba(6,182,212,0.6)] text-center transform hover:scale-[1.05]"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            Initialize Agent
                            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                    </Link>

                    <a
                        href="https://github.com/BendiKarthikeya/Transformers"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-10 py-5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 text-center"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.337-3.369-1.337-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.597 1.028 2.688 0 3.848-2.339 4.685-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" />
                        </svg>
                        Source
                    </a>
                </div>
            </main>

            {/* Feature Grid */}
            <section id="features" className="py-32 relative z-10 bg-slate-950">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-sm font-black text-cyan-500 uppercase tracking-[0.4em] mb-4">Tactical Arsenal</h2>
                        <h3 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase">Mission Capabilities</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <FeatureCard
                            icon={
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            }
                            title="Auto-Scan Matrix"
                            desc="Comprehensive repository reconnaissance to identify structural defects and test vulnerabilities."
                        />
                        <FeatureCard
                            icon={
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            }
                            title="Neural Repair"
                            desc="Context-aware logic restoration using advanced LLM sequences to patch production failures."
                        />
                        <FeatureCard
                            icon={
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            }
                            title="Infinite Re-Sync"
                            desc="Iterative verification pipeline that loops until operational stability reached 100%."
                        />
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-32 relative z-10 border-t border-white/5 bg-slate-900/20 backdrop-blur-3xl">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-24">
                        <h2 className="text-sm font-black text-purple-500 uppercase tracking-[0.4em] mb-4">Operational Protocol</h2>
                        <h3 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase">Deployment Sequence</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
                        <StepCard
                            number="01"
                            title="Infiltration"
                            desc="Cloning target repository and establishing secure environment parameters."
                            icon={
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a11 11 0 0115.143 0M4.929 4.929l.707.707m12.728 12.728l.707.707" />
                                </svg>
                            }
                        />
                        <StepCard
                            number="02"
                            numberColor="text-blue-500/20"
                            title="Diagnostics"
                            desc="Executing test suites and harvesting detailed logs for neural processing."
                            icon={
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
                                </svg>
                            }
                        />
                        <StepCard
                            number="03"
                            numberColor="text-purple-500/20"
                            title="Synthesis"
                            desc="Applying AI-generated code fixes to restore repository logic integrity."
                            icon={
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0" />
                                </svg>
                            }
                        />
                        <StepCard
                            number="04"
                            numberColor="text-green-500/20"
                            title="Validation"
                            desc="Verifying all systems are green and preparing production-ready patches."
                            icon={
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] border-t border-white/5 relative z-10 px-6 bg-slate-950">
                <p>Mission Success Guaranteed by <span className="text-cyan-500">TRANSFORMERS Core</span> • Sequence Lead: <span className="text-slate-400">KARTHIKEYA</span></p>
            </footer>

        </div>
    )
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="relative group p-px rounded-[32px] bg-white/5 hover:bg-gradient-to-br hover:from-cyan-500/20 hover:to-blue-500/20 transition-all duration-500 overflow-hidden animate-scan">
            <div className="relative h-full p-10 rounded-[31px] bg-slate-900/40 backdrop-blur-xl flex flex-col items-center text-center">
                <div className="p-5 rounded-2xl bg-cyan-500/10 text-cyan-400 mb-8 border border-cyan-500/20 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-500 box-glow-cyan">
                    {icon}
                </div>
                <h3 className="text-2xl font-black text-white mb-4 italic uppercase tracking-tighter group-hover:text-cyan-400 transition-colors">{title}</h3>
                <p className="text-slate-500 leading-relaxed text-xs font-bold uppercase tracking-wide">{desc}</p>
                <div className="mt-8 w-8 h-1 bg-slate-800 rounded-full group-hover:w-16 group-hover:bg-cyan-500 transition-all duration-500"></div>
            </div>
        </div>
    )
}

function StepCard({ number, title, desc, icon, numberColor = "text-cyan-500/20" }) {
    return (
        <div className="relative flex flex-col items-center text-center group">
            <div className="w-20 h-20 rounded-[28px] bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-10 shadow-2xl group-hover:border-cyan-500/50 group-hover:text-cyan-400 group-hover:-translate-y-2 transition-all duration-500 z-10 relative">
                <div className="absolute inset-0 bg-cyan-500/5 blur-xl group-hover:bg-cyan-500/10 transition-colors rounded-full"></div>
                {icon}
            </div>

            <div className={`absolute top-0 right-0 md:right-4 text-8xl font-black ${numberColor} italic select-none -z-0 opacity-40 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`}>
                {number}
            </div>

            <div className="relative z-10">
                <h3 className="text-xl font-black text-white mb-3 italic uppercase tracking-tighter group-hover:text-cyan-400 transition-colors leading-none">{title}</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.1em] leading-relaxed max-w-[200px]">{desc}</p>
            </div>

            <div className="mt-6 flex items-center gap-1.5">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-1 h-1 rounded-full bg-slate-800" style={{ opacity: 1 - i * 0.25 }}></div>
                ))}
            </div>
        </div>
    )
}
