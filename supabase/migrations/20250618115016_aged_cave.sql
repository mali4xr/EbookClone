/*
  # Fix RLS policies for books table soft delete

  1. Policy Updates
    - Drop and recreate UPDATE policies to allow soft deletes
    - Add DELETE policies for potential hard deletes
    - Ensure all CRUD operations work properly for books table

  2. Security
    - Maintain existing security model
    - Allow anonymous and authenticated users to update books (including soft deletes)
    - Allow delete operations for both user types
*/

-- Drop existing UPDATE policies that might be causing conflicts
DROP POLICY IF EXISTS "Anonymous users can update books" ON books;
DROP POLICY IF EXISTS "Authenticated users can update books" ON books;

-- Drop existing DELETE policies if they exist
DROP POLICY IF EXISTS "Anonymous users can delete books" ON books;
DROP POLICY IF EXISTS "Authenticated users can delete books" ON books;

-- Create new comprehensive UPDATE policy for anonymous users
CREATE POLICY "Anonymous users can update books"
  ON books
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create new comprehensive UPDATE policy for authenticated users  
CREATE POLICY "Authenticated users can update books"
  ON books
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create DELETE policy for anonymous users
CREATE POLICY "Anonymous users can delete books"
  ON books
  FOR DELETE
  TO anon
  USING (true);

-- Create DELETE policy for authenticated users
CREATE POLICY "Authenticated users can delete books"
  ON books
  FOR DELETE
  TO authenticated
  USING (true);