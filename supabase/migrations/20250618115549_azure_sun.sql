/*
  # Implement Authentication System for Book Management

  1. Security Changes
    - Remove anonymous user policies for books table
    - Restrict UPDATE and DELETE operations to authenticated users only
    - Keep SELECT policies for public read access to active books
    - Authenticated users can manage all books

  2. RLS Policies
    - Anonymous users: READ only for active books
    - Authenticated users: Full CRUD access to all books
*/

-- Drop all existing policies for books table
DROP POLICY IF EXISTS "Anonymous users can read active books" ON books;
DROP POLICY IF EXISTS "Authenticated users can read all books" ON books;
DROP POLICY IF EXISTS "Anonymous users can insert books" ON books;
DROP POLICY IF EXISTS "Authenticated users can insert books" ON books;
DROP POLICY IF EXISTS "Anonymous users can update books" ON books;
DROP POLICY IF EXISTS "Authenticated users can update books" ON books;
DROP POLICY IF EXISTS "Anonymous users can delete books" ON books;
DROP POLICY IF EXISTS "Authenticated users can delete books" ON books;

-- Create new restrictive policies

-- READ policies
CREATE POLICY "Public can read active books"
  ON books
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can read all books"
  ON books
  FOR SELECT
  TO authenticated
  USING (true);

-- WRITE policies (authenticated users only)
CREATE POLICY "Authenticated users can insert books"
  ON books
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update books"
  ON books
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete books"
  ON books
  FOR DELETE
  TO authenticated
  USING (true);