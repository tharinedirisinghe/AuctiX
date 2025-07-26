-- 1. Add columns for denormalized seller data
ALTER TABLE auctions
ADD COLUMN seller_full_name TEXT,
ADD COLUMN seller_username TEXT;

-- 2. Add tsvector column for full text search
ALTER TABLE auctions
ADD COLUMN search_vector tsvector;

-- 3. Populate seller denormalized columns from users table
UPDATE auctions a
SET seller_full_name = u.first_name || ' ' || u.last_name,
    seller_username = u.username
FROM users u
WHERE a.seller_id = u.id;

-- 4. Populate the search_vector column for existing rows
UPDATE auctions
SET search_vector =
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(seller_full_name, '')), 'D') ||
    setweight(to_tsvector('english', coalesce(seller_username, '')), 'D');

-- 5. Create a GIN index on the search_vector column
CREATE INDEX idx_auctions_search_vector ON auctions USING GIN(search_vector);

-- 6. Create trigger function to update search_vector on insert or update
CREATE OR REPLACE FUNCTION auctions_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
      setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(NEW.category, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(NEW.seller_full_name, '')), 'D') ||
      setweight(to_tsvector('english', coalesce(NEW.seller_username, '')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- 7. Attach the trigger to auctions table
CREATE TRIGGER trg_auctions_search_vector_update
BEFORE INSERT OR UPDATE ON auctions
FOR EACH ROW EXECUTE FUNCTION auctions_search_vector_update();

-- 8. Create trigger function to update denormalized seller info in auctions when users update their name/username
CREATE OR REPLACE FUNCTION update_auctions_seller_info() RETURNS trigger AS $$
BEGIN
  UPDATE auctions
  SET seller_full_name = NEW.first_name || ' ' || NEW.last_name,
      seller_username = NEW.username,
      updated_at = now()
  WHERE seller_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Attach the trigger to users table for updates on relevant columns
CREATE TRIGGER trg_users_after_update
AFTER UPDATE OF first_name, last_name, username ON users
FOR EACH ROW EXECUTE FUNCTION update_auctions_seller_info();
