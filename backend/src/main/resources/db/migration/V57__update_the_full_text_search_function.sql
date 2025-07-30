-- update to use the seller name in the function
CREATE OR REPLACE FUNCTION auctions_search_vector_update() RETURNS trigger AS $$
DECLARE
  seller users;
BEGIN
  -- Populate seller_full_name and seller_username from the users table
  SELECT * INTO seller FROM users WHERE id = NEW.seller_id;
  IF FOUND THEN
    NEW.seller_full_name := seller.first_name || ' ' || seller.last_name;
    NEW.seller_username := seller.username;
  END IF;

  -- Update search_vector based on auction fields and denormalized seller info
  NEW.search_vector :=
      setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(NEW.category, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(NEW.seller_full_name, '')), 'D') ||
      setweight(to_tsvector('english', coalesce(NEW.seller_username, '')), 'D');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;