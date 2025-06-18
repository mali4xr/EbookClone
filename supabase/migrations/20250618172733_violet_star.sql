/*
  # Fix unique constraint for story_pages table

  1. Changes
    - Remove existing unique constraint on page_number only
    - Add unique constraint on combination of page_number and book_id
    - Update corresponding indexes
    - Handle existing constraint/index names properly

  2. Security
    - Maintains existing RLS policies
    - No changes to permissions

  This allows multiple books to have the same page numbers while ensuring
  uniqueness within each book.
*/

-- First, check and drop existing constraints and indexes if they exist
DO $$
BEGIN
    -- Drop existing unique constraint on page_number only
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'story_pages_page_number_key' 
        AND table_name = 'story_pages'
    ) THEN
        ALTER TABLE story_pages DROP CONSTRAINT story_pages_page_number_key;
    END IF;

    -- Drop existing index on page_number only
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'story_pages_page_number_key'
    ) THEN
        DROP INDEX story_pages_page_number_key;
    END IF;

    -- Drop existing constraint if it already exists (from previous failed migration)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'story_pages_page_number_book_id_key' 
        AND table_name = 'story_pages'
    ) THEN
        ALTER TABLE story_pages DROP CONSTRAINT story_pages_page_number_book_id_key;
    END IF;

    -- Drop existing index if it already exists (from previous failed migration)
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'story_pages_page_number_book_id_key'
    ) THEN
        DROP INDEX story_pages_page_number_book_id_key;
    END IF;
END $$;

-- Add the new unique constraint on the combination of page_number and book_id
ALTER TABLE story_pages ADD CONSTRAINT story_pages_page_number_book_id_key UNIQUE (page_number, book_id);

-- Create the corresponding unique index
CREATE UNIQUE INDEX story_pages_page_number_book_id_key ON story_pages (page_number, book_id);