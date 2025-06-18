/*
  # Create books table and update story_pages schema

  1. New Tables
    - `books`
      - `id` (uuid, primary key)
      - `title` (text)
      - `subject` (text) - STORY, MATHS, SCIENCE, SPORTS, etc.
      - `author` (text)
      - `publisher` (text)
      - `description` (text)
      - `thumbnail_url` (text)
      - `cover_image_url` (text)
      - `difficulty_level` (text) - beginner, intermediate, advanced
      - `target_age_min` (integer)
      - `target_age_max` (integer)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Update story_pages table
    - Add `book_id` foreign key reference
    - Keep existing structure for backward compatibility

  3. Settings table for book-specific settings
    - `user_settings`
      - `id` (uuid, primary key)
      - `book_id` (uuid, foreign key)
      - `user_id` (text) - for future user system, nullable for now
      - `voice_index` (integer)
      - `rate` (decimal)
      - `pitch` (decimal)
      - `volume` (decimal)
      - `settings_data` (jsonb) - for additional settings
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  4. Security
    - Enable RLS on all new tables
    - Add policies for public read access
    - Add policies for authenticated users to manage content

  5. Initial Data
    - Insert sample books for different subjects
    - Update existing story pages to reference the default story book
*/

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text NOT NULL CHECK (subject IN ('STORY', 'MATHS', 'SCIENCE', 'SPORTS', 'HISTORY', 'GEOGRAPHY', 'ART', 'MUSIC')),
  author text NOT NULL,
  publisher text NOT NULL,
  description text,
  thumbnail_url text NOT NULL,
  cover_image_url text NOT NULL,
  difficulty_level text DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  target_age_min integer DEFAULT 3,
  target_age_max integer DEFAULT 12,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add book_id to story_pages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'story_pages' AND column_name = 'book_id'
  ) THEN
    ALTER TABLE story_pages ADD COLUMN book_id uuid REFERENCES books(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create user_settings table for book-specific settings
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id text, -- nullable for now, for future user system
  voice_index integer DEFAULT 0,
  rate decimal DEFAULT 1.0,
  pitch decimal DEFAULT 1.0,
  volume decimal DEFAULT 1.0,
  settings_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(book_id, user_id) -- one setting per book per user
);

-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Books policies
CREATE POLICY "Anyone can read books"
  ON books
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert books"
  ON books
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update books"
  ON books
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Anonymous users can insert books"
  ON books
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update books"
  ON books
  FOR UPDATE
  TO anon
  USING (true);

-- User settings policies
CREATE POLICY "Anyone can read user settings"
  ON user_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert user settings"
  ON user_settings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update user settings"
  ON user_settings
  FOR UPDATE
  TO public
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_books_subject ON books(subject);
CREATE INDEX IF NOT EXISTS idx_books_active ON books(is_active);
CREATE INDEX IF NOT EXISTS idx_story_pages_book_id ON story_pages(book_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_book_id ON user_settings(book_id);

-- Insert sample books
INSERT INTO books (title, subject, author, publisher, description, thumbnail_url, cover_image_url, difficulty_level, target_age_min, target_age_max) VALUES
(
  'Luna''s Garden Adventure',
  'STORY',
  'Interactive Learning Team',
  'EduBooks Publishing',
  'Join Luna the rabbit on a magical journey through the garden, learning about friendship and helping others.',
  'https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
  'https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
  'beginner',
  3,
  8
),
(
  'Numbers and Counting Fun',
  'MATHS',
  'Dr. Sarah Mathematics',
  'MathKids Publishing',
  'Learn numbers, counting, and basic arithmetic through fun interactive exercises and colorful illustrations.',
  'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
  'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
  'beginner',
  4,
  7
),
(
  'Amazing Animals',
  'SCIENCE',
  'Prof. Nature Explorer',
  'Science Wonder Books',
  'Discover fascinating facts about animals, their habitats, and how they live in the wild.',
  'https://images.pexels.com/photos/1661179/pexels-photo-1661179.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
  'https://images.pexels.com/photos/1661179/pexels-photo-1661179.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
  'intermediate',
  5,
  10
),
(
  'Sports Heroes',
  'SPORTS',
  'Coach Champion',
  'Active Kids Media',
  'Meet amazing athletes and learn about different sports, teamwork, and staying healthy.',
  'https://images.pexels.com/photos/1618269/pexels-photo-1618269.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
  'https://images.pexels.com/photos/1618269/pexels-photo-1618269.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
  'beginner',
  4,
  9
),
(
  'World Explorers',
  'GEOGRAPHY',
  'Captain Discovery',
  'World Learning Press',
  'Travel around the world and learn about different countries, cultures, and amazing places.',
  'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
  'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
  'intermediate',
  6,
  12
),
(
  'Creative Art Adventures',
  'ART',
  'Artist Palette',
  'Creative Kids Studio',
  'Explore colors, shapes, and artistic techniques while creating your own masterpieces.',
  'https://images.pexels.com/photos/1148998/pexels-photo-1148998.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
  'https://images.pexels.com/photos/1148998/pexels-photo-1148998.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
  'beginner',
  3,
  10
);

-- Get the story book ID and update existing story pages
DO $$
DECLARE
  story_book_id uuid;
BEGIN
  SELECT id INTO story_book_id FROM books WHERE subject = 'STORY' AND title = 'Luna''s Garden Adventure';
  
  IF story_book_id IS NOT NULL THEN
    UPDATE story_pages SET book_id = story_book_id WHERE book_id IS NULL;
  END IF;
END $$;