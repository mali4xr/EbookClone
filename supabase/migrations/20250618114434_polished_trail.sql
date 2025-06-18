/*
  # Fix RLS policies for book deletion

  1. Policy Updates
    - Update the SELECT policy to allow reading all books (including inactive ones) for authenticated users
    - Update the UPDATE policy to properly handle soft deletes (setting is_active to false)
    - Ensure anonymous users can still read active books
    
  2. Security
    - Maintain security while allowing proper CRUD operations
    - Allow authenticated users to manage books (including soft deletes)
    - Keep anonymous access limited to active books only
*/

-- Drop existing policies to recreate them with proper permissions
DROP POLICY IF EXISTS "Anyone can read books" ON books;
DROP POLICY IF EXISTS "Anonymous users can update books" ON books;
DROP POLICY IF EXISTS "Authenticated users can update books" ON books;

-- Create new SELECT policies
-- Anonymous users can only see active books
CREATE POLICY "Anonymous users can read active books"
  ON books
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Authenticated users can see all books (active and inactive)
CREATE POLICY "Authenticated users can read all books"
  ON books
  FOR SELECT
  TO authenticated
  USING (true);

-- Create new UPDATE policies
-- Anonymous users can update books (maintaining existing functionality)
CREATE POLICY "Anonymous users can update books"
  ON books
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Authenticated users can update books (including soft deletes)
CREATE POLICY "Authenticated users can update books"
  ON books
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);