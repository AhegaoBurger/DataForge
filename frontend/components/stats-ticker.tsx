"use client"

import { useEffect, useState } from "react"

export function StatsTicker() {
  const [stats, setStats] = useState({
    videos: 12847,
    earned: 25694,
    contributors: 3421,
  })

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setStats((prev) => ({
        videos: prev.videos + Math.floor(Math.random() * 3),
        earned: prev.earned + Math.floor(Math.random() * 5),
        contributors: prev.contributors + (Math.random() > 0.95 ? 1 : 0),
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="text-center">
        <div className="text-4xl font-bold text-primary lg:text-5xl">{stats.videos.toLocaleString()}</div>
        <div className="mt-2 text-sm text-muted-foreground">Videos Collected</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold text-secondary lg:text-5xl">${stats.earned.toLocaleString()}</div>
        <div className="mt-2 text-sm text-muted-foreground">Earned by Contributors</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold text-accent lg:text-5xl">{stats.contributors.toLocaleString()}</div>
        <div className="mt-2 text-sm text-muted-foreground">Active Contributors</div>
      </div>
    </div>
  )
}
