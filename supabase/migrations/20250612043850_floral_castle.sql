/*
  # Add anonymous user policies for story_pages table

  1. Security Changes
    - Add policy for anonymous users to insert story pages
    - Add policy for anonymous users to update story pages
    - Keep existing policies for authenticated users and public read access

  This enables the demo application to work without requiring user authentication
  while maintaining the existing security structure.
*/

-- Allow anonymous users to insert story pages
CREATE POLICY "Anonymous users can insert story pages"
  ON story_pages
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to update story pages
CREATE POLICY "Anonymous users can update story pages"
  ON story_pages
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);