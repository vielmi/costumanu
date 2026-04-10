-- Seed three fictional network theaters for the Suchmodus "Kostüm Netzwerk" section.
-- brand_color and show_in_network are stored in the existing settings JSONB column.

INSERT INTO theaters (name, slug, settings) VALUES
  ('Stadttheater Musterberg', 'stadttheater-musterberg', '{"brand_color": "#1A1A2E", "show_in_network": true}'),
  ('Theaterhaus Helvetia',    'theaterhaus-helvetia',    '{"brand_color": "#2D4A22", "show_in_network": true}'),
  ('Studio Nord',             'studio-nord',             '{"brand_color": "#3D1A00", "show_in_network": true}')
ON CONFLICT (slug) DO NOTHING;
