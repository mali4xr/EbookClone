/*
  # Add background music support to story pages

  1. Changes
    - Add `background_music_url` column to `story_pages` table
    - Column is nullable (optional) and stores text URLs
    - Add index for better query performance when filtering by music presence

  2. Security
    - No RLS changes needed as existing policies cover the new column
*/

-- Add background_music_url column to story_pages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'story_pages' AND column_name = 'background_music_url'
  ) THEN
    ALTER TABLE story_pages ADD COLUMN background_music_url text;
  END IF;
END $$;

-- Add index for better performance when querying pages with background music
CREATE INDEX IF NOT EXISTS idx_story_pages_background_music 
ON story_pages (background_music_url) 
WHERE background_music_url IS NOT NULL;