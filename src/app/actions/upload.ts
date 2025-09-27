'use server'

import { uploadToR2, generateAssetKey } from '@/lib/r2'
import { createAssetRecord } from '@/lib/airtable'
import { AssetMetadata } from '@/types'

interface UploadResult {
  success: boolean
  error?: string
  assets?: Array<{ id: string; filename: string; url: string }>
}

export async function uploadAssets(formData: FormData): Promise<UploadResult> {
  try {
    console.log('=== UPLOAD START ===')
    const files = formData.getAll('files') as File[]
    const metadataString = formData.get('metadata') as string
    const batchMode = formData.get('batchMode') === 'true'

    console.log('Files received:', files.length)
    console.log('Metadata string:', metadataString)
    console.log('Batch mode:', batchMode)

    if (!files || files.length === 0) {
      console.log('ERROR: No files provided')
      return { success: false, error: 'No files provided' }
    }

    const metadata: AssetMetadata = JSON.parse(metadataString)
    console.log('Parsed metadata:', metadata)

    if (!metadata.event || !metadata.date || !metadata.photographer) {
      console.log('ERROR: Missing required metadata fields')
      return { success: false, error: 'Missing required metadata fields' }
    }

    const uploadResults = []

    for (const file of files) {
      try {
        console.log(`--- Processing file: ${file.name} ---`)
        console.log('File size:', file.size)
        console.log('File type:', file.type)

        // Generate unique key for R2
        const key = generateAssetKey(file.name)
        console.log('Generated key:', key)

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        console.log('Buffer size:', buffer.length)

        // Upload to R2
        console.log('Starting R2 upload...')
        const publicUrl = await uploadToR2(key, buffer, file.type)
        console.log('R2 upload complete. Public URL:', publicUrl)

        // Get file dimensions/metadata if it's an image or video
        let width: number | undefined
        let height: number | undefined
        let duration: number | undefined

        const fileType: 'image' | 'video' = file.type.startsWith('image/') ? 'image' : 'video'
        console.log('Detected file type:', fileType)

        // For images, we could extract dimensions here using a library like sharp
        // For videos, we could extract metadata using ffprobe
        // For now, we'll leave these undefined and handle on the client side if needed

        // Create asset record in Airtable
        console.log('Starting Airtable record creation...')
        const assetData = {
          filename: key,
          originalFilename: file.name,
          url: publicUrl, // Use the public URL as the main URL
          fileType,
          mimeType: file.type,
          size: file.size,
          width,
          height,
          duration,
          uploadedAt: new Date().toISOString(),
          event: metadata.event,
          date: metadata.date,
          photographer: metadata.photographer,
          tags: metadata.tags,
          description: metadata.description,
        }
        console.log('Asset data to create:', assetData)

        const asset = await createAssetRecord(assetData)
        console.log('Airtable record created with ID:', asset.id)

        uploadResults.push({
          id: asset.id,
          filename: file.name,
          url: publicUrl,
        })
        console.log(`--- File ${file.name} processed successfully ---`)
      } catch (fileError) {
        console.error(`=== ERROR uploading file ${file.name} ===`)
        console.error('Error type:', typeof fileError)
        console.error('Error message:', fileError instanceof Error ? fileError.message : 'Not an Error object')
        console.error('Error stack:', fileError instanceof Error ? fileError.stack : 'No stack')
        console.error('Raw error object:', fileError)
        return {
          success: false,
          error: `Failed to upload ${file.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`
        }
      }
    }

    console.log('=== UPLOAD SUCCESS ===')
    console.log('Upload results:', uploadResults)
    return {
      success: true,
      assets: uploadResults,
    }
  } catch (error) {
    console.error('=== TOP LEVEL UPLOAD ERROR ===')
    console.error('Error type:', typeof error)
    console.error('Error message:', error instanceof Error ? error.message : 'Not an Error object')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('Raw error object:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}