'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Image, Video, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { StatsData } from '@/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <p className="text-gray-500">Unable to load dashboard data</p>
        </div>
      </div>
    )
  }

  const imageCount = stats.recentUploads.filter(asset => asset.fileType === 'image').length
  const videoCount = stats.recentUploads.filter(asset => asset.fileType === 'video').length

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Manage your speaker asset collection
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAssets}</div>
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <Image className="h-4 w-4 mr-1" />
              {imageCount} photos
              <Video className="h-4 w-4 ml-3 mr-1" />
              {videoCount} videos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalEvents}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Total events covered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.recentUploads.length}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Last 5 assets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/upload" className="w-full">
            <Button className="w-full justify-start h-20" size="lg">
              <Upload className="mr-3 h-6 w-6" />
              <div className="text-left">
                <div className="font-semibold">Upload Assets</div>
                <div className="text-sm font-normal opacity-90">Add new photos or videos</div>
              </div>
            </Button>
          </Link>
          <Link href="/gallery" className="w-full">
            <Button variant="outline" className="w-full justify-start h-20" size="lg">
              <Image className="mr-3 h-6 w-6" />
              <div className="text-left">
                <div className="font-semibold">Browse Gallery</div>
                <div className="text-sm font-normal">View and manage your assets</div>
              </div>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}