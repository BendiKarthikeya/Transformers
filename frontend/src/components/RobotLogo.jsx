import React from 'react'

export default function RobotLogo({ className = "w-10 h-10" }) {
    return (
        <div className={`${className} relative`}>
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                {/* Head */}
                <rect x="25" y="20" width="50" height="40" rx="8" className="fill-slate-900 stroke-cyan-500" strokeWidth="3" />

                {/* Eyes */}
                <rect x="35" y="32" width="10" height="6" rx="3" className="fill-cyan-400 animate-pulse" />
                <rect x="55" y="32" width="10" height="6" rx="3" className="fill-cyan-400 animate-pulse" />

                {/* Antenna */}
                <line x1="50" y1="20" x2="50" y2="10" className="stroke-cyan-500" strokeWidth="3" strokeLinecap="round" />
                <circle cx="50" cy="8" r="3" className="fill-cyan-400 shadow-lg" />

                {/* Mouth/Grill */}
                <rect x="38" y="48" width="24" height="4" rx="2" className="fill-slate-800 stroke-slate-700" strokeWidth="1" />

                {/* Body/Neck */}
                <rect x="42" y="60" width="16" height="6" className="fill-slate-800" />
                <path d="M30 66 H70 L75 85 H25 L30 66Z" className="fill-slate-900 stroke-cyan-500" strokeWidth="3" />

                {/* Badge on chest */}
                <circle cx="50" cy="75" r="4" className="fill-cyan-500/20 stroke-cyan-400" strokeWidth="1" />
                <path d="M48 75 L50 73 L52 75 L50 77 Z" className="fill-cyan-400" />
            </svg>
        </div>
    )
}
