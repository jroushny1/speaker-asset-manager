'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react'

interface ConnectionStatus {
  name: string
  description: string
  status: 'checking' | 'success' | 'error' | 'warning'
  error?: string
  details?: string
}

export default function SetupPage() {
  const [checking, setChecking] = useState(false)
  const [connections, setConnections] = useState<ConnectionStatus[]>([
    {
      name: 'Environment Variables',
      description: 'Check if all required environment variables are set',
      status: 'checking'
    },
    {
      name: 'Cloudflare R2',
      description: 'Test connection to Cloudflare R2 bucket',
      status: 'checking'
    },
    {
      name: 'Airtable',
      description: 'Test connection to Airtable base and table',
      status: 'checking'
    }
  ])

  const checkConnections = async () => {
    setChecking(true)

    // Reset all statuses
    setConnections(prev => prev.map(conn => ({ ...conn, status: 'checking', error: undefined, details: undefined })))

    try {
      // Check environment variables
      const envVars = [
        'CLOUDFLARE_ACCOUNT_ID',
        'CLOUDFLARE_ACCESS_KEY_ID',
        'CLOUDFLARE_SECRET_ACCESS_KEY',
        'CLOUDFLARE_BUCKET_NAME',
        'CLOUDFLARE_PUBLIC_URL',
        'AIRTABLE_ACCESS_TOKEN',
        'AIRTABLE_BASE_ID',
        'AIRTABLE_TABLE_NAME'
      ]

      const missingVars = envVars.filter(varName => !process.env[varName])

      setConnections(prev => prev.map(conn =>
        conn.name === 'Environment Variables'
          ? {
              ...conn,
              status: missingVars.length === 0 ? 'success' : 'error',
              error: missingVars.length > 0 ? `Missing variables: ${missingVars.join(', ')}` : undefined,
              details: missingVars.length === 0 ? 'All required environment variables are set' : undefined
            }
          : conn
      ))

      // Test Cloudflare R2 connection
      try {
        const r2Response = await fetch('/api/test/r2')
        const r2Result = await r2Response.json()

        setConnections(prev => prev.map(conn =>
          conn.name === 'Cloudflare R2'
            ? {
                ...conn,
                status: r2Result.success ? 'success' : 'error',
                error: r2Result.error,
                details: r2Result.success ? 'Successfully connected to R2 bucket' : undefined
              }
            : conn
        ))
      } catch (error) {
        setConnections(prev => prev.map(conn =>
          conn.name === 'Cloudflare R2'
            ? {
                ...conn,
                status: 'error',
                error: 'Failed to test R2 connection'
              }
            : conn
        ))
      }

      // Test Airtable connection
      try {
        const airtableResponse = await fetch('/api/test/airtable')
        const airtableResult = await airtableResponse.json()

        setConnections(prev => prev.map(conn =>
          conn.name === 'Airtable'
            ? {
                ...conn,
                status: airtableResult.success ? 'success' : 'error',
                error: airtableResult.error,
                details: airtableResult.success ? `Connected to table: ${airtableResult.tableName}` : undefined
              }
            : conn
        ))
      } catch (error) {
        setConnections(prev => prev.map(conn =>
          conn.name === 'Airtable'
            ? {
                ...conn,
                status: 'error',
                error: 'Failed to test Airtable connection'
              }
            : conn
        ))
      }

    } finally {
      setChecking(false)
    }
  }

  const getStatusIcon = (status: ConnectionStatus['status']) => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: ConnectionStatus['status']) => {
    switch (status) {
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>
      case 'success':
        return <Badge className="bg-green-500">Connected</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'warning':
        return <Badge className="bg-yellow-500">Warning</Badge>
    }
  }

  const allConnected = connections.every(conn => conn.status === 'success')
  const hasErrors = connections.some(conn => conn.status === 'error')

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup & Configuration</h1>
        <p className="text-gray-600">
          Verify that all API connections are working properly
        </p>
      </div>

      {/* Overall Status */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Connection Status</CardTitle>
            <Button
              onClick={checkConnections}
              disabled={checking}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking...' : 'Test Connections'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {allConnected && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700 font-medium">
                All connections are working properly! You're ready to use the application.
              </span>
            </div>
          )}

          {hasErrors && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 font-medium">
                Some connections have errors. Please check your configuration.
              </span>
            </div>
          )}

          {!allConnected && !hasErrors && !checking && (
            <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              <span className="text-blue-700 font-medium">
                Click "Test Connections" to verify your setup.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Connection Status */}
      <div className="space-y-4 mb-8">
        {connections.map((connection) => (
          <Card key={connection.name}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStatusIcon(connection.status)}
                  <div>
                    <h3 className="font-semibold text-lg">{connection.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{connection.description}</p>

                    {connection.details && (
                      <p className="text-green-700 text-sm">{connection.details}</p>
                    )}

                    {connection.error && (
                      <p className="text-red-600 text-sm">{connection.error}</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(connection.status)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Environment Variables</h3>
            <p className="text-sm text-gray-600 mb-3">
              Create a <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code> file in your project root with these variables:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono">
              {`# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id_here
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key_here
CLOUDFLARE_BUCKET_NAME=your_bucket_name_here
CLOUDFLARE_PUBLIC_URL=https://your-bucket.r2.dev

# Airtable Configuration
AIRTABLE_ACCESS_TOKEN=your_access_token_here
AIRTABLE_BASE_ID=your_base_id_here
AIRTABLE_TABLE_NAME=Assets`}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Cloudflare R2 Setup</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>1. Log into your Cloudflare dashboard</p>
              <p>2. Go to R2 Object Storage and create a new bucket</p>
              <p>3. In "Manage R2 API tokens", create a new token with Object Read & Write permissions</p>
              <p>4. Set up a custom domain for your bucket (optional but recommended)</p>
            </div>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <a href="https://developers.cloudflare.com/r2/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                R2 Documentation
              </a>
            </Button>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Airtable Setup</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>1. Create a new Airtable base or use an existing one</p>
              <p>2. Create a table called "Assets" (or update AIRTABLE_TABLE_NAME)</p>
              <p>3. Go to your Airtable account settings and create a Personal Access Token</p>
              <p>4. Get your base ID from the Airtable API documentation page</p>
            </div>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <a href="https://airtable.com/developers/web/api/introduction" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Airtable API Docs
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}