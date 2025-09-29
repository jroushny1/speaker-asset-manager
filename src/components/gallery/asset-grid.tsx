'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play, Download, Eye, Share2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Asset } from '@/types'
import { cn } from '@/lib/utils'

interface AssetGridProps {
  assets: Asset[]
  onAssetClick?: (asset: Asset) => void
  onDownload?: (asset: Asset) => void
  onShare?: (asset: Asset) => void
}

export function AssetGrid({ assets, onAssetClick, onDownload, onShare }: AssetGridProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleImageError = (assetId: string) => {
    setImageErrors(prev => new Set(prev).add(assetId))
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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No assets found</p>
        <p className="text-gray-400 text-sm mt-2">
          Upload some photos and videos to get started
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {assets.map((asset) => (
        <Card
          key={asset.id}
          className="group overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onAssetClick?.(asset)}
        >
          <div className="relative aspect-square bg-gray-100">
            {asset.fileType === 'image' &&
             asset.publicUrl &&
             asset.publicUrl.trim() !== '' &&
             !imageErrors.has(asset.id) ? (
              <Image
                src={asset.publicUrl}
                alt={asset.originalFilename || 'Uploaded image'}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                onError={() => handleImageError(asset.id)}
              />
            ) : asset.fileType === 'video' ? (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <Play className="h-12 w-12 text-white opacity-70" />
              </div>
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl mb-2">📄</div>
                  <div className="text-xs text-gray-500 px-2 truncate">
                    {asset.originalFilename}
                  </div>
                </div>
              </div>
            )}

            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAssetClick?.(asset)
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    onShare?.(asset)
                  }}
                  title="Share Link"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDownload?.(asset)
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* File type indicator */}
            <div className="absolute top-2 right-2">
              {asset.fileType === 'video' && (
                <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center">
                  <Play className="h-3 w-3 mr-1" />
                  Video
                </div>
              )}
            </div>
          </div>

          {/* Asset info */}
          <div className="p-3">
            <h3 className="font-medium text-sm truncate mb-1" title={`${asset.event} - ${asset.photographer}`}>
              {asset.event}
            </h3>
            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex items-center justify-between">
                <span className="truncate">{asset.photographer}</span>
                <span>{formatFileSize(asset.size)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{formatDate(asset.date)}</span>
                <span className="capitalize">{asset.fileType}</span>
              </div>
              {asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {asset.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {asset.tags.length > 2 && (
                    <span className="text-gray-400 text-xs">
                      +{asset.tags.length - 2} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}