import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const requiredVars = [
      'CLOUDFLARE_ACCOUNT_ID',
      'CLOUDFLARE_ACCESS_KEY_ID',
      'CLOUDFLARE_SECRET_ACCESS_KEY',
      'CLOUDFLARE_BUCKET_NAME',
      'CLOUDFLARE_PUBLIC_URL',
      'AIRTABLE_ACCESS_TOKEN',
      'AIRTABLE_BASE_ID',
      'AIRTABLE_TABLE_NAME'
    ]

    const missingVars = requiredVars.filter(varName => !process.env[varName])
    const hasPlaceholders = requiredVars.filter(varName => {
      const value = process.env[varName]
      return value && (
        value.includes('your_') ||
        value.includes('_here') ||
        value === 'Assets' // old default table name
      )
    })

    const allVarsSet = missingVars.length === 0 && hasPlaceholders.length === 0

    return NextResponse.json({
      success: allVarsSet,
      missingVars,
      hasPlaceholders,
      message: allVarsSet
        ? 'All environment variables are properly configured'
        : `Issues found: ${[...missingVars, ...hasPlaceholders.map(v => `${v} has placeholder value`)].join(', ')}`
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check environment variables'
    }, { status: 500 })
  }
}