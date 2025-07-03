/*
  # Allow anonymous users to see all books (active and inactive)

  1. Policy Updates
    - Update the anonymous user SELECT policy to allow reading all books
    - Keep authenticated users able to see all books
    - Maintain existing INSERT/UPDATE/DELETE restrictions for security

  2. Security
    - Anonymous users can READ all books (active and inactive)
    - Only authenticated users can CREATE/UPDATE/DELETE books
    - This allows the "Coming Soon" functionality to work for all users
*/

-- Drop the existing restrictive policy for anonymous users
DROP POLICY IF EXISTS "Public can read active books" ON books;

-- Create new policy allowing anonymous users to read all books
CREATE POLICY "Public can read all books"
  ON books
  FOR SELECT
  TO public
  USING (true);

-- Keep the existing authenticated user policy (no changes needed)
-- CREATE POLICY "Authenticated users can read all books" already exists