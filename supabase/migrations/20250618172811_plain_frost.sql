/*
  # Fix unique constraint for story_pages table

  1. Changes Made
    - Remove old unique constraint on page_number only
    - Add new unique constraint on (page_number, book_id) combination
    - This allows same page numbers across different books
    - Ensures uniqueness within each book

  2. Safety Measures
    - Check for existing constraints before dropping/creating
    - Handle both constraint and index management
    - Prevent duplicate creation errors
*/

DO $$
BEGIN
    -- Drop existing unique constraint on page_number only if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'story_pages_page_number_key' 
        AND table_name = 'story_pages'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE story_pages DROP CONSTRAINT story_pages_page_number_key;
    END IF;

    -- Drop existing index on page_number only if it exists
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'story_pages_page_number_key'
        AND schemaname = 'public'
    ) THEN
        DROP INDEX story_pages_page_number_key;
    END IF;

    -- Only create the new constraint if it doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'story_pages_page_number_book_id_key' 
        AND table_name = 'story_pages'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE story_pages ADD CONSTRAINT story_pages_page_number_book_id_key UNIQUE (page_number, book_id);
    END IF;

    -- Only create the new index if it doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'story_pages_page_number_book_id_key'
        AND schemaname = 'public'
    ) THEN
        CREATE UNIQUE INDEX story_pages_page_number_book_id_key ON story_pages (page_number, book_id);
    END IF;
END $$;