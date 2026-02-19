import React from 'react'
import { Link } from 'react-router-dom'

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500 selection:text-white overflow-hidden relative">

            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
                <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-2000"></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">T</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight">TRANSFORMERS AGENT</span>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                    <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
                    <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How it Works</a>
                    <Link
                        to="/dashboard"
                        className="px-5 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-all backdrop-blur-sm"
                    >
                        Open Dashboard
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16 lg:pt-32 lg:pb-24 flex flex-col items-center text-center">

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm mb-8 animate-fade-in-up">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs font-medium text-slate-300 tracking-wide uppercase">RIFT 2026 Hackathon Submission</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 animate-fade-in-up delay-100">
                    Autonomous CI/CD <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">Healing Agent</span>
                </h1>

                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed animate-fade-in-up delay-200">
                    Detects, diagnosing, and fixes pipeline failures automatically.
                    Powered by multi-agent LLM architecture to reduce debugging time by 60%.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300">
                    <Link
                        to="/dashboard"
                        className="group relative px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_40px_-10px_rgba(34,211,238,0.5)] hover:shadow-[0_0_60px_-15px_rgba(34,211,238,0.7)]"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Launch Agent
                            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                    </Link>

                    <a
                        href="https://github.com/BendiKarthikeya/Transformers"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl font-semibold transition-all flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.337-3.369-1.337-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.597 1.028 2.688 0 3.848-2.339 4.685-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" />
                        </svg>
                        View Source
                    </a>
                </div>
            </main>

            {/* Feature Grid */}
            <section id="features" className="py-20 relative z-10 bg-slate-900/50 backdrop-blur-sm border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon="🔍"
                            title="Automated Discovery"
                            desc="Scans your repository, identifying test files and dependencies automatically."
                        />
                        <FeatureCard
                            icon="🧠"
                            title="AI-Powered Fixes"
                            desc="Generates context-aware fixes for logic, syntax, and type errors using LLMs."
                        />
                        <FeatureCard
                            icon="⚡"
                            title="Continuous Healing"
                            desc="Iteratively runs tests, applies fixes, and verifies until the pipeline passes."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 text-center text-slate-500 text-sm border-t border-slate-800/50 relative z-10">
                <p>Built by Team TRANSFORMERS • Leader: KARTHIKEYA</p>
            </footer>

        </div>
    )
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 transition-all group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{title}</h3>
            <p className="text-slate-400 leading-relaxed">{desc}</p>
        </div>
    )
}
