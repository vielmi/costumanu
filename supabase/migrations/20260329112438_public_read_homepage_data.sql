-- Make homepage data readable by anonymous (unauthenticated) visitors.
-- Taxonomy terms, published events, and basic theater info are public catalog data.

-- taxonomy_terms: replace authenticated-only with public read
DROP POLICY "Authenticated users can read taxonomy" ON taxonomy_terms;
CREATE POLICY "Anyone can read taxonomy"
  ON taxonomy_terms FOR SELECT
  USING (true);

-- events: replace authenticated-only with public read (published only)
DROP POLICY "Authenticated users can view published events" ON events;
CREATE POLICY "Anyone can view published events"
  ON events FOR SELECT
  USING (is_published = true);

-- theaters: add public read for basic listing (keeps existing member policy for full access)
CREATE POLICY "Anyone can view theaters"
  ON theaters FOR SELECT
  USING (true);
