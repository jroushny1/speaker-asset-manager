'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Upload, Image, Video, Calendar, User, TrendingUp, Share2, Tag, Clock, Eye } from 'lucide-react'
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
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

  // Calculate more useful metrics
  const allAssets = stats.recentUploads // This would ideally be all assets, not just recent
  const imageCount = allAssets.filter(asset => asset.fileType === 'image').length
  const videoCount = allAssets.filter(asset => asset.fileType === 'video').length
  const totalSize = allAssets.reduce((sum, asset) => sum + asset.size, 0)

  // Get recent events (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentEvents = Array.from(new Set(
    allAssets
      .filter(asset => new Date(asset.date) >= thirtyDaysAgo)
      .map(asset => asset.event)
  ))

  // Get popular tags
  const tagCounts: Record<string, number> = {}
  allAssets.forEach(asset => {
    asset.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })
  const popularTags = Object.entries(tagCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count: count as number }))

  // Get upcoming events (events with future dates)
  const upcomingEvents = Array.from(new Set(
    allAssets
      .filter(asset => new Date(asset.date) > new Date())
      .map(asset => ({ event: asset.event, date: asset.date }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  )).slice(0, 3)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Overview of your speaker asset collection
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssets}</div>
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <Image className="h-3 w-3 mr-1" />
              {imageCount} photos
              <Video className="h-3 w-3 ml-2 mr-1" />
              {videoCount} videos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentEvents.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Events covered this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Popular Content</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">
              {popularTags[0]?.tag || 'None'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Top tag ({popularTags[0]?.count || 0} assets)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Share</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.recentUploads.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Ready to share
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/upload">
              <Button className="w-full justify-start" size="lg">
                <Upload className="mr-2 h-4 w-4" />
                Upload New Assets
              </Button>
            </Link>
            <Link href="/gallery">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Image className="mr-2 h-4 w-4" />
                Browse Gallery
              </Button>
            </Link>
            <Link href="/setup">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <TrendingUp className="mr-2 h-4 w-4" />
                Setup & Configuration
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Popular Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {popularTags.length > 0 ? (
              <div className="space-y-3">
                {popularTags.map((item, index) => (
                  <div key={item.tag} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        <Tag className="h-3 w-3 text-blue-600" />
                      </div>
                      <span className="font-medium">{item.tag}</span>
                    </div>
                    <Badge variant="secondary">{item.count} assets</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No tags yet. Add tags to your assets to see popular content types.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Events & Quick Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Event Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEvents.length > 0 ? (
              <div className="space-y-3">
                {recentEvents.slice(0, 5).map((event, index) => (
                  <div key={event} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <span className="font-medium">{event}</span>
                      <p className="text-sm text-gray-500">Recent coverage</p>
                    </div>
                    <Link href={`/gallery?event=${encodeURIComponent(event)}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No recent event coverage. Upload assets from your speaking events.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Share - Latest Assets</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentUploads.length > 0 ? (
              <div className="space-y-3">
                {stats.recentUploads.slice(0, 4).map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      {asset.fileType === 'image' ? (
                        <Image className="h-5 w-5 text-gray-500" />
                      ) : (
                        <Video className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{asset.originalFilename}</p>
                      <p className="text-xs text-gray-500">{asset.event}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => {
                        navigator.clipboard.writeText(asset.publicUrl)
                        // You could add a toast notification here
                      }}
                    >
                      <Share2 className="h-3 w-3" />
                      Copy
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Share2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No assets to share yet</p>
                <Link href="/upload">
                  <Button>Upload Your First Assets</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}