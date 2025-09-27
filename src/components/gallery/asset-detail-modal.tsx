'use client'

import Image from 'next/image'
import { Download, Calendar, User, Tag, FileText, X, Play, Share2, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Asset } from '@/types'

interface AssetDetailModalProps {
  asset: Asset
  isOpen: boolean
  onClose: () => void
  onDownload: (asset: Asset) => void
  onShare?: (asset: Asset) => void
}

export function AssetDetailModal({
  asset,
  isOpen,
  onClose,
  onDownload,
  onShare
}: AssetDetailModalProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatUploadDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate pr-4">{asset.originalFilename}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(asset)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Preview */}
          <div className="space-y-4">
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              {asset.fileType === 'image' ? (
                <Image
                  src={asset.publicUrl}
                  alt={asset.originalFilename}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-16 w-16 text-white opacity-70 mx-auto mb-4" />
                    <p className="text-white">Video Preview</p>
                    <p className="text-gray-300 text-sm mt-2">
                      Click download to view full video
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Technical Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">File Size:</span>
                <p className="font-medium">{formatFileSize(asset.size)}</p>
              </div>
              <div>
                <span className="text-gray-500">File Type:</span>
                <p className="font-medium capitalize">{asset.fileType}</p>
              </div>
              {asset.width && asset.height && (
                <>
                  <div>
                    <span className="text-gray-500">Dimensions:</span>
                    <p className="font-medium">{asset.width} × {asset.height}px</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Aspect Ratio:</span>
                    <p className="font-medium">
                      {(asset.width / asset.height).toFixed(2)}:1
                    </p>
                  </div>
                </>
              )}
              {asset.duration && (
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <p className="font-medium">{asset.duration}s</p>
                </div>
              )}
            </div>
          </div>

          {/* Asset Metadata */}
          <div className="space-y-6">
            {/* Event Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Event Details</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{asset.event}</p>
                    <p className="text-sm text-gray-500">{formatDate(asset.date)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Photographer</p>
                    <p className="font-medium">{asset.photographer}</p>
                  </div>
                </div>

                {asset.description && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="text-sm">{asset.description}</p>
                    </div>
                  </div>
                )}

                {asset.tags.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {asset.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Information */}
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-lg mb-3">Upload Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Uploaded:</span>
                  <p className="font-medium">{formatUploadDate(asset.uploadedAt)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Original Filename:</span>
                  <p className="font-medium break-all">{asset.originalFilename}</p>
                </div>
                <div>
                  <span className="text-gray-500">MIME Type:</span>
                  <p className="font-medium">{asset.mimeType}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => onDownload(asset)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Original File
                </Button>

                <Button
                  variant="outline"
                  onClick={() => onShare?.(asset)}
                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                  size="lg"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Copy Share Link
                </Button>

                {asset.fileType === 'image' && (
                  <Button
                    variant="outline"
                    className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                    size="lg"
                    onClick={() => window.open(asset.publicUrl, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Size
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}