import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AgentProvider } from './context/AgentContext'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <AgentProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </AgentProvider>
  )
}
