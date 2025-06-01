# OpenArchive Document Processing Backend

This is the document processing backend for the OpenArchive project. It provides functionality for uploading documents, processing them with AWS Textract for text extraction, and storing the results in Supabase.

## Features

- Document upload and storage
- Text extraction using AWS Textract
- Document metadata management
- Authentication with Supabase

## Project Structure

```
/src
  /middleware
    - auth.ts             # Authentication middleware
  /models
    - document.ts         # Document model and interfaces
  /repositories
    - documentRepository.ts # Document data access layer
  /routes
    - documents.ts        # Document API routes
  /services
    - documentService.ts  # Document business logic
    - storage.ts          # File storage service
    - supabase.ts         # Supabase client configuration
    - textract.ts         # AWS Textract integration
  - index.ts              # Main application entry point
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- AWS account with Textract access
- Supabase account and project

## Setup

1. Clone the repository

2. Install dependencies
   ```bash
   cd backend
   npm install
   ```

3. Create a `.env` file based on `.env.example`
   ```
   # Server Configuration
   PORT=3000

   # AWS Configuration
   AWS_REGION=eu-central-1
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key

   # File Upload Configuration
   MAX_FILE_SIZE=10485760 # 10MB in bytes
   UPLOAD_DIRECTORY=uploads
   ```

4. Set up the Supabase database by running the following SQL in the Supabase SQL editor:

   ```sql
   -- Create documents table
   create table public.documents (
     id uuid primary key default uuid_generate_v4(),
     title text not null,
     file_name text not null,
     file_type text not null,
     file_size integer not null,
     storage_path text not null,
     extracted_text text,
     status text not null default 'PROCESSING',
     created_at timestamp with time zone default now(),
     updated_at timestamp with time zone default now(),
     created_by uuid references auth.users(id)
   );

   -- Enable RLS
   alter table public.documents enable row level security;

   -- Create policy for authenticated users
   create policy "Users can view their own documents"
     on public.documents for select
     using (auth.uid() = created_by);

   create policy "Users can insert their own documents"
     on public.documents for insert
     with check (auth.uid() = created_by);
   ```

5. Create a storage bucket in Supabase named 'documents' with public access

## Development

Start the development server:

```bash
npm run dev
```

The server will run on http://localhost:3000 (or the port specified in your .env file).

## Build for Production

```bash
npm run build
```

This will compile the TypeScript code to JavaScript in the `dist` directory.

## Running in Production

```bash
npm start
```

## API Endpoints

### Documents

- **POST /api/documents**
  - Upload and process a document
  - Headers: `Authorization: Bearer <token>`
  - Body: `multipart/form-data` with `file` and `title` fields
  - Response: Document object

- **GET /api/documents**
  - Get all documents for the authenticated user
  - Headers: `Authorization: Bearer <token>`
  - Response: Array of document objects

- **GET /api/documents/:id**
  - Get a document by ID
  - Headers: `Authorization: Bearer <token>`
  - Response: Document object

- **DELETE /api/documents/:id**
  - Delete a document
  - Headers: `Authorization: Bearer <token>`
  - Response: Success message

### Health Check

- **GET /api/health**
  - Check if the API is running
  - Response: `{ "status": "ok" }`

## Authentication

This backend uses Supabase for authentication. To authenticate API requests, include the Supabase JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

You can obtain this token by signing in through Supabase Auth.