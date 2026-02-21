-- Required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================
-- 1. CORE MULTI-TENANCY
-- ============================================================

CREATE TABLE theaters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address_info JSONB, -- Address, coordinates for map search
  settings JSONB DEFAULT '{"allow_external_sharing": true}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1b. USER-THEATER MEMBERSHIP (required for RLS)
CREATE TABLE theater_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theater_id UUID REFERENCES theaters(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(theater_id, user_id)
);

-- 1c. USER PROFILES (Figma: "Mein Profil" with professional title, avatar, phone)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  professional_title TEXT, -- e.g., "Kostümassistentin", "Kostümbildner", "Fundusleiterin"
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. STANDARDIZED TAXONOMY (Requirements B01-B03)
-- ============================================================
-- Prevents data mess by forcing juniors/users to pick from valid options.
-- Vocabularies: 'gender', 'clothing_type', 'sparte', 'epoche', 'material',
--               'materialoptik', 'muster', 'color', 'washing_instruction'
CREATE TABLE taxonomy_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vocabulary TEXT NOT NULL,
  label_de TEXT NOT NULL,
  parent_id UUID REFERENCES taxonomy_terms(id),
  sort_order INTEGER DEFAULT 0,
  UNIQUE(vocabulary, label_de)
);

-- ============================================================
-- 3. THE COSTUME (The Design/Concept)
-- ============================================================
-- Represents a "look" or "design" which may have multiple physical instances.
CREATE TABLE costumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theater_id UUID REFERENCES theaters(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Core Categorization
  gender_term_id UUID REFERENCES taxonomy_terms(id),
  clothing_type_id UUID REFERENCES taxonomy_terms(id),

  -- Hierarchical Ensembles (The "Set" Logic)
  parent_costume_id UUID REFERENCES costumes(id) ON DELETE SET NULL,
  is_ensemble BOOLEAN DEFAULT false,

  -- Search optimization: Unified document for 1M+ row full-text search
  fts_doc tsvector GENERATED ALWAYS AS (
    to_tsvector('german', name || ' ' || coalesce(description, ''))
  ) STORED,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3b. COSTUME-TAXONOMY MANY-TO-MANY
-- Links costumes to multiple taxonomy terms (sparte, epoche, material,
-- materialoptik, muster, color, washing_instruction, etc.)
CREATE TABLE costume_taxonomy (
  costume_id UUID REFERENCES costumes(id) ON DELETE CASCADE NOT NULL,
  term_id UUID REFERENCES taxonomy_terms(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (costume_id, term_id)
);

-- ============================================================
-- 4. THE ITEM (The Physical Asset - The 1M+ rows)
-- ============================================================
-- This tracks the actual piece of fabric in a box.
CREATE TABLE costume_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  costume_id UUID REFERENCES costumes(id) ON DELETE CASCADE NOT NULL,
  theater_id UUID REFERENCES theaters(id) ON DELETE CASCADE NOT NULL, -- Denormalized for fast RLS
  barcode_id TEXT UNIQUE NOT NULL, -- QR/Barcode (B05)
  rfid_id TEXT UNIQUE,            -- Separate RFID tag identifier

  -- Physical State (B02/B04)
  size_label TEXT,      -- Konfektionsgrösse: "M", "52", "XL"
  size_data JSONB,      -- Detailed body measurements:
                        -- { "chest": 102, "waist": 88, "back_length": 72,
                        --   "shoulder_width": 45, "hip": 96, "inseam": 82,
                        --   "thigh": 58, "waistband": 84, "skirt_length": 125 }
  condition_grade INTEGER CHECK (condition_grade BETWEEN 1 AND 5),
  current_status TEXT NOT NULL DEFAULT 'available'
    CHECK (current_status IN ('available', 'rented', 'cleaning', 'repair', 'lost')),

  -- Logistics
  storage_location_path TEXT, -- e.g., "Südpol.Stock2.Regal4.Box12"
  is_public_for_rent BOOLEAN DEFAULT false,

  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. COSTUME MEDIA (photos linked to Supabase Storage)
-- ============================================================

CREATE TABLE costume_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  costume_id UUID REFERENCES costumes(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL, -- Path in Supabase Storage bucket
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. THEATRICAL PROVENANCE (Requirement B01)
-- ============================================================
-- Tracks the "Life" of a costume: Who wore it, in what play, and when.
CREATE TABLE costume_provenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  costume_id UUID REFERENCES costumes(id) ON DELETE CASCADE NOT NULL,
  production_title TEXT NOT NULL,  -- Stücktitel
  year INTEGER,
  actor_name TEXT,                 -- Darsteller
  role_name TEXT,                  -- Rolle
  director_name TEXT,              -- Regie
  costume_designer TEXT,           -- Kostümbildner
  costume_assistant TEXT,          -- Kostümassistenz
  is_original_production BOOLEAN DEFAULT true
);

-- ============================================================
-- 7. MERKLISTEN / WATCHLISTS (Figma: "Kostüm merken")
-- ============================================================
-- Named lists of costumes, typically per production. Users can share them
-- with collaborators and use them as a source for rental orders.

CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theater_id UUID REFERENCES theaters(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,              -- e.g., "Romeo & Julia 2024"
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE NOT NULL,
  costume_id UUID REFERENCES costumes(id) ON DELETE CASCADE NOT NULL,
  note TEXT,
  sort_order INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(wishlist_id, costume_id)
);

CREATE TABLE wishlist_collaborators (
  wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  can_edit BOOLEAN DEFAULT false,
  PRIMARY KEY (wishlist_id, user_id)
);

-- ============================================================
-- 8. WARENKORB / SHOPPING CART
-- ============================================================
-- Temporary selection of costume items before creating a rental order.

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  costume_id UUID REFERENCES costumes(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, costume_id)
);

-- ============================================================
-- 9. TEMPORAL RESERVATIONS & LENDING (H03/Release X)
-- ============================================================
-- Uses Postgres native DATERANGE to prevent overlapping rentals (double-booking).

CREATE TABLE rental_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_theater_id UUID REFERENCES theaters(id) NOT NULL,
  borrower_theater_id UUID REFERENCES theaters(id), -- NULL if external/manual person
  borrower_user_id UUID REFERENCES auth.users(id),  -- The person who created the request

  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'approved', 'active', 'returned', 'cancelled')),
  production_context TEXT,  -- Verwendungszweck: what the items are used for
  rental_period DATERANGE,  -- Ausleihdauer: overall rental window

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE item_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES costume_items(id) NOT NULL,
  order_id UUID REFERENCES rental_orders(id) ON DELETE CASCADE NOT NULL,
  period DATERANGE NOT NULL, -- The specific window the item is blocked

  -- THE "KILLER FEATURE": Database-level prevention of double booking.
  -- This ensures an item can NEVER be booked for overlapping dates.
  EXCLUDE USING gist (item_id WITH =, period WITH &&)
);

-- ============================================================
-- 10. COMMUNICATION (The Figma "Nachrichten" / Inbox)
-- ============================================================
-- Supports both order-linked and direct messages between users.

CREATE TABLE chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES rental_orders(id) ON DELETE SET NULL, -- NULL for direct messages
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chat_thread_participants (
  thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (thread_id, user_id)
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 11. EVENTS / ANNOUNCEMENTS (Figma homepage: "Rampenverkauf Fundus...")
-- ============================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theater_id UUID REFERENCES theaters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  image_storage_path TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- High-speed search for Epoch/Material/Category
CREATE INDEX idx_costume_fts ON costumes USING GIN (fts_doc);

-- Performance for the "Theater Marketplace" (finding what's available to rent)
CREATE INDEX idx_item_availability ON costume_items(is_public_for_rent, current_status)
WHERE is_public_for_rent = true;

-- Fast theater lookups on high-volume tables
CREATE INDEX idx_costume_items_theater ON costume_items(theater_id);
CREATE INDEX idx_costumes_theater ON costumes(theater_id);

-- Taxonomy lookups by vocabulary
CREATE INDEX idx_taxonomy_vocabulary ON taxonomy_terms(vocabulary);

-- Wishlist lookups
CREATE INDEX idx_wishlists_owner ON wishlists(owner_id);
CREATE INDEX idx_wishlists_theater ON wishlists(theater_id);
CREATE INDEX idx_wishlist_items_costume ON wishlist_items(costume_id);

-- Cart lookups
CREATE INDEX idx_cart_items_user ON cart_items(user_id);

-- Chat thread lookups
CREATE INDEX idx_chat_messages_thread ON chat_messages(thread_id, created_at);
CREATE INDEX idx_chat_threads_order ON chat_threads(order_id);

-- Rental order lookups
CREATE INDEX idx_rental_orders_borrower_user ON rental_orders(borrower_user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE theaters ENABLE ROW LEVEL SECURITY;
ALTER TABLE theater_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE costumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE costume_taxonomy ENABLE ROW LEVEL SECURITY;
ALTER TABLE costume_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE costume_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE costume_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is a member of a theater
CREATE OR REPLACE FUNCTION is_member_of(check_theater_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM theater_members
    WHERE theater_id = check_theater_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Theaters: members can see their own theaters
CREATE POLICY "Members can view their theater"
  ON theaters FOR SELECT
  USING (is_member_of(id));

-- Theater members: users can see co-members
CREATE POLICY "Members can view co-members"
  ON theater_members FOR SELECT
  USING (is_member_of(theater_id));

-- Profiles: users can read any profile, but only update their own
CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Taxonomy: readable by all authenticated users
CREATE POLICY "Authenticated users can read taxonomy"
  ON taxonomy_terms FOR SELECT
  TO authenticated
  USING (true);

-- Costumes: theater members can CRUD their own
CREATE POLICY "Members can view costumes"
  ON costumes FOR SELECT
  USING (is_member_of(theater_id));

CREATE POLICY "Members can insert costumes"
  ON costumes FOR INSERT
  WITH CHECK (is_member_of(theater_id));

CREATE POLICY "Members can update costumes"
  ON costumes FOR UPDATE
  USING (is_member_of(theater_id));

CREATE POLICY "Members can delete costumes"
  ON costumes FOR DELETE
  USING (is_member_of(theater_id));

-- Public marketplace: anyone authenticated can see costumes with public items
CREATE POLICY "Public costumes visible to all authenticated"
  ON costumes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM costume_items ci
      WHERE ci.costume_id = id
        AND ci.is_public_for_rent = true
        AND ci.current_status = 'available'
    )
  );

-- Costume taxonomy: follows costume access
CREATE POLICY "Members can manage costume taxonomy"
  ON costume_taxonomy FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM costumes c
      WHERE c.id = costume_id AND is_member_of(c.theater_id)
    )
  );

-- Costume items: same pattern, using denormalized theater_id
CREATE POLICY "Members can view items"
  ON costume_items FOR SELECT
  USING (is_member_of(theater_id));

CREATE POLICY "Members can insert items"
  ON costume_items FOR INSERT
  WITH CHECK (is_member_of(theater_id));

CREATE POLICY "Members can update items"
  ON costume_items FOR UPDATE
  USING (is_member_of(theater_id));

CREATE POLICY "Members can delete items"
  ON costume_items FOR DELETE
  USING (is_member_of(theater_id));

-- Public marketplace: anyone authenticated can see items marked for rent
CREATE POLICY "Public items visible to all authenticated"
  ON costume_items FOR SELECT
  TO authenticated
  USING (is_public_for_rent = true AND current_status = 'available');

-- Costume media: follows costume access
CREATE POLICY "Members can manage costume media"
  ON costume_media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM costumes c
      WHERE c.id = costume_id AND is_member_of(c.theater_id)
    )
  );

-- Costume provenance: follows costume access
CREATE POLICY "Members can manage costume provenance"
  ON costume_provenance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM costumes c
      WHERE c.id = costume_id AND is_member_of(c.theater_id)
    )
  );

-- Wishlists: owner and collaborators can see them
CREATE POLICY "Owner can manage wishlists"
  ON wishlists FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "Collaborators can view wishlists"
  ON wishlists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wishlist_collaborators wc
      WHERE wc.wishlist_id = id AND wc.user_id = auth.uid()
    )
  );

-- Wishlist items: owner and collaborators
CREATE POLICY "Wishlist owner can manage items"
  ON wishlist_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM wishlists w
      WHERE w.id = wishlist_id AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Wishlist collaborators can view items"
  ON wishlist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wishlist_collaborators wc
      WHERE wc.wishlist_id = wishlist_id AND wc.user_id = auth.uid()
    )
  );

CREATE POLICY "Wishlist edit-collaborators can manage items"
  ON wishlist_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM wishlist_collaborators wc
      WHERE wc.wishlist_id = wishlist_id AND wc.user_id = auth.uid() AND wc.can_edit = true
    )
  );

-- Wishlist collaborators: owner manages, collaborators can see
CREATE POLICY "Wishlist owner can manage collaborators"
  ON wishlist_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM wishlists w
      WHERE w.id = wishlist_id AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Collaborators can view co-collaborators"
  ON wishlist_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wishlist_collaborators wc
      WHERE wc.wishlist_id = wishlist_id AND wc.user_id = auth.uid()
    )
  );

-- Cart: users manage their own cart
CREATE POLICY "Users manage their own cart"
  ON cart_items FOR ALL
  USING (user_id = auth.uid());

-- Rental orders: visible to both lender and borrower theaters
CREATE POLICY "Lender/borrower can view orders"
  ON rental_orders FOR SELECT
  USING (
    is_member_of(lender_theater_id)
    OR is_member_of(borrower_theater_id)
    OR borrower_user_id = auth.uid()
  );

CREATE POLICY "Authenticated users can create orders"
  ON rental_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Lender/borrower can update orders"
  ON rental_orders FOR UPDATE
  USING (
    is_member_of(lender_theater_id)
    OR is_member_of(borrower_theater_id)
    OR borrower_user_id = auth.uid()
  );

-- Item reservations: follows order access
CREATE POLICY "Order participants can manage reservations"
  ON item_reservations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rental_orders ro
      WHERE ro.id = order_id
        AND (is_member_of(ro.lender_theater_id) OR is_member_of(ro.borrower_theater_id)
             OR ro.borrower_user_id = auth.uid())
    )
  );

-- Chat threads: participants only
CREATE POLICY "Participants can view threads"
  ON chat_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_thread_participants ctp
      WHERE ctp.thread_id = id AND ctp.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create threads"
  ON chat_threads FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Chat thread participants: participants can see co-participants
CREATE POLICY "Participants can view co-participants"
  ON chat_thread_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_thread_participants ctp
      WHERE ctp.thread_id = thread_id AND ctp.user_id = auth.uid()
    )
  );

CREATE POLICY "Thread creator can add participants"
  ON chat_thread_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Chat messages: participants of the thread can read/write
CREATE POLICY "Thread participants can view messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_thread_participants ctp
      WHERE ctp.thread_id = thread_id AND ctp.user_id = auth.uid()
    )
  );

CREATE POLICY "Thread participants can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_thread_participants ctp
      WHERE ctp.thread_id = thread_id AND ctp.user_id = auth.uid()
    )
  );

-- Events: published events visible to all authenticated, theater members manage
CREATE POLICY "Authenticated users can view published events"
  ON events FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Members can manage theater events"
  ON events FOR ALL
  USING (is_member_of(theater_id));
