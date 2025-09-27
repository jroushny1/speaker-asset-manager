# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Speaker Asset Manager is a professional digital asset management system for conference speakers. It allows users to upload, organize, search, and share photos and videos from speaking events using modern web technologies.

## Commands

### Development
- `npm run dev` - Start the development server with Turbo
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm run typecheck` - Run TypeScript type checking

### Testing & Verification
- Visit `/setup` to verify all API connections are working
- Check environment variables are properly configured
- Test uploads with small files first

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Storage**: Cloudflare R2 (S3-compatible object storage)
- **Database**: Airtable for metadata and organization
- **Upload**: React Dropzone with server actions

### Project Structure
```
src/
├── app/                    # Next.js app router pages
│   ├── actions/           # Server actions (upload.ts)
│   ├── api/              # API routes (test connections)
│   ├── dashboard/        # Dashboard with stats
│   ├── gallery/          # Gallery view with search/filters
│   ├── setup/            # Setup verification page
│   └── upload/           # Upload page with dropzone
├── components/            # React components
│   ├── gallery/          # Gallery components (grid, modal, filters)
│   ├── layout/           # Navigation and layout
│   ├── ui/               # shadcn/ui components
│   └── upload/           # Upload components (dropzone)
├── lib/                  # Core utilities
│   ├── airtable.ts      # Airtable client and operations
│   ├── r2.ts            # Cloudflare R2 client and operations
│   └── utils.ts         # General utilities (cn, etc.)
└── types/               # TypeScript type definitions
```

### Key Features
1. **Upload System**: Drag-and-drop upload with batch mode support
2. **Asset Storage**: Files stored in Cloudflare R2, metadata in Airtable
3. **Gallery**: Responsive grid with search, filtering, and modal detail view
4. **Dashboard**: Statistics and quick actions
5. **Setup Verification**: Built-in API connection testing

### Data Flow
1. User uploads files via `/upload` page
2. Files processed by server action in `src/app/actions/upload.ts`
3. Files uploaded to Cloudflare R2 using client in `src/lib/r2.ts`
4. Metadata saved to Airtable using client in `src/lib/airtable.ts`
5. Assets displayed in gallery, fetched from Airtable with R2 URLs

### Environment Variables Required
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account identifier
- `CLOUDFLARE_ACCESS_KEY_ID` - R2 API access key
- `CLOUDFLARE_SECRET_ACCESS_KEY` - R2 API secret key
- `CLOUDFLARE_BUCKET_NAME` - R2 bucket name
- `CLOUDFLARE_PUBLIC_URL` - Public URL for R2 assets
- `AIRTABLE_ACCESS_TOKEN` - Airtable personal access token
- `AIRTABLE_BASE_ID` - Airtable base identifier
- `AIRTABLE_TABLE_NAME` - Airtable table name (usually "Assets")

### Important Implementation Notes
- Server actions are used for file uploads to handle large files securely
- Images are displayed using Next.js Image component with proper optimization
- Asset metadata includes event name, photographer, date, tags, and description
- Search functionality works across all text fields and tags
- Download functionality uses signed URLs from R2 for security
- Batch upload mode allows applying same metadata to multiple files
- All API connections can be tested via the `/setup` page

### Development Workflow
1. Set up environment variables in `.env.local`
2. Run `npm run dev` to start development server
3. Visit `/setup` to verify all connections work
4. Test upload functionality with small files first
5. Use `/dashboard` to monitor application statistics
6. Check `/gallery` for asset management features