/*
  # Add unique constraint for page_number and book_id combination

  1. Changes
    - Remove the existing unique constraint on page_number only
    - Add a new unique constraint on the combination of page_number and book_id
    - This allows multiple books to have the same page numbers while ensuring uniqueness within each book

  2. Security
    - No changes to RLS policies needed
    - Existing policies remain intact
*/

-- First, drop the existing unique constraint on page_number only
ALTER TABLE story_pages DROP CONSTRAINT IF EXISTS story_pages_page_number_key;

-- Add a new unique constraint on the combination of page_number and book_id
-- This allows the same page_number across different books but ensures uniqueness within each book
ALTER TABLE story_pages ADD CONSTRAINT story_pages_page_number_book_id_key UNIQUE (page_number, book_id);

-- Update the index to match the new constraint
DROP INDEX IF EXISTS story_pages_page_number_key;
CREATE UNIQUE INDEX story_pages_page_number_book_id_key ON story_pages (page_number, book_id);