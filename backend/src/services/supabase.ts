/**
 * Supabase service configuration
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create and export the Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * SQL for creating the documents table in Supabase:
 *
 * ```sql
 * create table public.documents (
 *   id uuid primary key default uuid_generate_v4(),
 *   title text not null,
 *   file_name text not null,
 *   file_type text not null,
 *   file_size integer not null,
 *   storage_path text not null,
 *   extracted_text text,
 *   status text not null default 'PROCESSING',
 *   created_at timestamp with time zone default now(),
 *   updated_at timestamp with time zone default now(),
 *   created_by uuid references auth.users(id)
 * );
 *
 * -- Enable RLS
 * alter table public.documents enable row level security;
 *
 * -- Create policy for authenticated users
 * create policy "Users can view their own documents"
 *   on public.documents for select
 *   using (auth.uid() = created_by);
 *
 * create policy "Users can insert their own documents"
 *   on public.documents for insert
 *   with check (auth.uid() = created_by);
 * ```
 */