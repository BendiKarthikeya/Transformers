import React, { createContext, useContext, useState, useCallback } from 'react'
import axios from 'axios'

const AgentContext = createContext()

export function AgentProvider({ children }) {
  const [repoUrl, setRepoUrl] = useState('')
  const [teamName, setTeamName] = useState('')
  const [leaderName, setLeaderName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const setInput = useCallback((repo, team = '', leader = '') => {
    setRepoUrl(repo)
    setTeamName(team)
    setLeaderName(leader)
    setError(null)
  }, [])

  const runAgent = useCallback(async (repo, team = '', leader = '') => {
    if (!repo || !repo.trim()) {
      setError('Repository URL is required')
      return
    }

    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await axios.post(`${apiUrl}/api/run-agent`, {
        repo_url: repo,
        team_name: team,
        team_leader: leader
      })

      setResults(response.data)
      setRepoUrl('')
      setTeamName('')
      setLeaderName('')
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to run agent'
      setError(errorMsg)
      console.error('Error running agent:', err)
    } finally {
      setIsLoading(false)
    }
  }, [apiUrl])

  const clearResults = useCallback(() => {
    setResults(null)
    setError(null)
    setRepoUrl('')
    setTeamName('')
    setLeaderName('')
  }, [])

  const value = {
    repoUrl,
    teamName,
    leaderName,
    isLoading,
    results,
    error,
    setInput,
    runAgent,
    clearResults
  }

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  )
}

export function useAgent() {
  const context = useContext(AgentContext)
  if (!context) {
    throw new Error('useAgent must be used within AgentProvider')
  }
  return context
}
