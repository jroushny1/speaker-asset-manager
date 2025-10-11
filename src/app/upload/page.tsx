'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { UploadDropzone } from '@/components/upload/dropzone'
import { AssetMetadata, UploadProgress } from '@/types'
// import { uploadAssets } from '@/app/actions/upload' // Using API route instead

const COMMON_TAGS = [
  'Headshot',
  'Keynote',
  'Presentation',
  'Networking',
  'Panel',
  'Workshop',
  'Conference',
  'Speaking',
  'Audience',
  'Backstage',
  'Award',
  'Group Photo',
  'Candid'
]

export default function UploadPage() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [metadata, setMetadata] = useState<AssetMetadata>({
    event: '',
    date: '',
    photographer: '',
    tags: [],
    description: '',
  })
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [batchMode, setBatchMode] = useState(false)

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles)

    // Check file sizes and warn about large files
    const largeFiles = selectedFiles.filter(file => file.size > 100 * 1024 * 1024) // 100MB
    const veryLargeFiles = selectedFiles.filter(file => file.size > 500 * 1024 * 1024) // 500MB

    if (veryLargeFiles.length > 0) {
      toast.info(`${veryLargeFiles.length} very large file(s) selected (500MB+). Uploads may take 10-20 minutes each.`, {
        duration: 8000
      })
    } else if (largeFiles.length > 0) {
      toast.info(`${largeFiles.length} large file(s) selected (100MB+). Uploads may take 3-8 minutes each.`, {
        duration: 6000
      })
    }
  }

  const handleMetadataChange = (field: keyof AssetMetadata, value: string | string[]) => {
    setMetadata((prev) => ({ ...prev, [field]: value }))
  }

  const toggleTag = (tag: string) => {
    const newTags = metadata.tags.includes(tag)
      ? metadata.tags.filter(t => t !== tag)
      : [...metadata.tags, tag]
    handleMetadataChange('tags', newTags)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const checkFileSize = (files: File[]) => {
    const largeFiles = files.filter(file => file.size > 100 * 1024 * 1024) // 100MB
    const veryLargeFiles = files.filter(file => file.size > 500 * 1024 * 1024) // 500MB

    if (veryLargeFiles.length > 0) {
      const fileInfo = veryLargeFiles.map(f => `${f.name} (${formatFileSize(f.size)})`).join(', ')
      toast.warning(`Very large files detected: ${fileInfo}. Upload may take 10-20 minutes per file.`, {
        duration: 10000
      })
    } else if (largeFiles.length > 0) {
      const fileInfo = largeFiles.map(f => `${f.name} (${formatFileSize(f.size)})`).join(', ')
      toast.info(`Large files detected: ${fileInfo}. Upload may take 3-8 minutes per file.`, {
        duration: 8000
      })
    }
  }


  const uploadFileDirectly = async (file: File, index: number) => {
    try {
      // Update progress to show getting presigned URL
      setUploadProgress(prev =>
        prev.map((p, i) => i === index ? { ...p, status: 'uploading', progress: 5 } : p)
      )

      // Get presigned URL
      console.log(`Getting presigned URL for ${file.name} (${file.size} bytes)`)
      const presignedResponse = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        })
      })

      if (!presignedResponse.ok) {
        const errorText = await presignedResponse.text()
        console.error('Presigned URL error:', errorText)
        throw new Error(`Failed to get presigned URL: ${presignedResponse.status} - ${errorText}`)
      }

      const { presignedUrl, key, publicUrl } = await presignedResponse.json()
      console.log('Got presigned URL, starting upload to R2...')

      // Update progress to show uploading to R2
      setUploadProgress(prev =>
        prev.map((p, i) => i === index ? { ...p, progress: 20 } : p)
      )

      // Upload directly to R2 with progress tracking
      const xhr = new XMLHttpRequest()

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 70) + 20 // 20-90%
            setUploadProgress(prev =>
              prev.map((p, i) => i === index ? { ...p, progress } : p)
            )
          }
        })

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            try {
              // Update progress to show saving metadata
              setUploadProgress(prev =>
                prev.map((p, i) => i === index ? { ...p, progress: 95 } : p)
              )

              // Determine file type from MIME type or extension
              const getFileType = (file: File): 'image' | 'video' => {
                if (file.type.startsWith('image/')) return 'image'
                if (file.type.startsWith('video/')) return 'video'

                // Fallback to extension check
                const ext = file.name.split('.').pop()?.toLowerCase()
                const videoExtensions = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv']
                return videoExtensions.includes(ext || '') ? 'video' : 'image'
              }

              // Save metadata to Airtable
              const metadataResponse = await fetch('/api/upload/metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  key,
                  originalFilename: file.name,
                  publicUrl,
                  fileType: getFileType(file),
                  mimeType: file.type,
                  size: file.size,
                  metadata
                })
              })

              if (!metadataResponse.ok) {
                throw new Error(`Failed to save metadata: ${metadataResponse.status}`)
              }

              const result = await metadataResponse.json()

              // Update progress to complete
              setUploadProgress(prev =>
                prev.map((p, i) => i === index ? { ...p, status: 'completed', progress: 100 } : p)
              )

              resolve(result.asset)
            } catch (metadataError) {
              setUploadProgress(prev =>
                prev.map((p, i) => i === index ? { ...p, status: 'error', error: 'Failed to save metadata' } : p)
              )
              reject(metadataError)
            }
          } else {
            setUploadProgress(prev =>
              prev.map((p, i) => i === index ? { ...p, status: 'error', error: `Upload failed: ${xhr.status}` } : p)
            )
            reject(new Error(`Upload failed with status: ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', (e) => {
          console.error('XHR error event:', e)
          console.error('XHR status:', xhr.status)
          console.error('XHR response:', xhr.response)
          setUploadProgress(prev =>
            prev.map((p, i) => i === index ? { ...p, status: 'error', error: `Network error: ${xhr.status} ${xhr.statusText}` } : p)
          )
          reject(new Error(`Network error during upload: ${xhr.status} ${xhr.statusText}`))
        })

        xhr.addEventListener('abort', () => {
          console.error('XHR aborted')
          setUploadProgress(prev =>
            prev.map((p, i) => i === index ? { ...p, status: 'error', error: 'Upload aborted' } : p)
          )
          reject(new Error('Upload aborted'))
        })

        xhr.addEventListener('timeout', () => {
          console.error('XHR timeout')
          setUploadProgress(prev =>
            prev.map((p, i) => i === index ? { ...p, status: 'error', error: 'Upload timeout' } : p)
          )
          reject(new Error('Upload timeout'))
        })

        console.log('Opening XHR connection to presigned URL')
        xhr.open('PUT', presignedUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        console.log('Sending file via XHR:', file.name, file.size, file.type)
        xhr.send(file)
      })
    } catch (error: any) {
      setUploadProgress(prev =>
        prev.map((p, i) => i === index ? { ...p, status: 'error', error: error.message } : p)
      )
      throw error
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    // Check for large files and warn user
    checkFileSize(files)

    setUploading(true)
    setUploadProgress(
      files.map((file) => ({
        filename: file.name,
        progress: 0,
        status: 'pending',
      }))
    )

    // Show upload starting toast with timeout warning
    const uploadToast = toast.loading(
      `Uploading ${files.length} file(s)... This may take several minutes for large files.`,
      { duration: Infinity }
    )

    try {
      // Upload all files directly to R2 using presigned URLs
      const uploadResults = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const asset = await uploadFileDirectly(file, i)
        uploadResults.push(asset)
      }

      toast.dismiss(uploadToast)
      toast.success(`Successfully uploaded ${files.length} file(s)!`, {
        icon: '🎉'
      })
      router.push('/gallery')

    } catch (error: any) {
      toast.dismiss(uploadToast)
      console.error('=== CLIENT UPLOAD ERROR ===')
      console.error('Error type:', typeof error)
      console.error('Error message:', error?.message)
      console.error('Error stack:', error?.stack)
      console.error('Full error:', error)

      const errorMessage = error.message?.includes('timeout')
        ? 'Upload timed out. Try uploading smaller files or check your connection.'
        : `Upload failed: ${error.message || 'Unknown error'}`

      toast.error(errorMessage, { duration: 10000 })
      setUploadProgress(prev =>
        prev.map(p => p.status !== 'completed' ? { ...p, status: 'error', error: errorMessage } : p)
      )
    } finally {
      setUploading(false)
    }
  }

  const isFormValid = metadata.event && metadata.date && files.length > 0

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Assets</h1>
        <p className="text-gray-600">
          Upload photos and videos from your speaking events
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Files</CardTitle>
            </CardHeader>
            <CardContent>
              <UploadDropzone onFilesSelected={handleFilesSelected} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="event">Event Name *</Label>
                <Input
                  id="event"
                  value={metadata.event}
                  onChange={(e) => handleMetadataChange('event', e.target.value)}
                  placeholder="TechConf 2024"
                  required
                />
              </div>

              <div>
                <Label htmlFor="date">Event Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={metadata.date}
                  onChange={(e) => handleMetadataChange('date', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="photographer">Photographer</Label>
                <Input
                  id="photographer"
                  value={metadata.photographer}
                  onChange={(e) => handleMetadataChange('photographer', e.target.value)}
                  placeholder="John Doe Photography"
                />
              </div>

              <div>
                <Label>Tags</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {COMMON_TAGS.map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant={metadata.tags.includes(tag) ? "default" : "outline"}
                      size="sm"
                      className={`h-8 text-xs ${
                        metadata.tags.includes(tag)
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
                {metadata.tags.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {metadata.tags.join(', ')}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={metadata.description}
                  onChange={(e) => handleMetadataChange('description', e.target.value)}
                  placeholder="Additional notes about these assets..."
                  rows={3}
                />
              </div>

              {files.length > 1 && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="batchMode"
                    checked={batchMode}
                    onChange={(e) => setBatchMode(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="batchMode" className="text-sm">
                    Apply same metadata to all files
                  </Label>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleUpload}
            disabled={!isFormValid || uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} Files`}
          </Button>
        </div>
      </div>

      {uploadProgress.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadProgress.map((progress, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{progress.filename}</span>
                  <span className="text-sm text-gray-500 capitalize">
                    {progress.status}
                  </span>
                </div>
                <Progress value={progress.progress} className="w-full" />
                {progress.error && (
                  <p className="text-sm text-red-600">{progress.error}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}