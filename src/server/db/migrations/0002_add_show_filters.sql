-- Add new columns to shows table
ALTER TABLE shows
ADD COLUMN min_price NUMERIC,
ADD COLUMN max_price NUMERIC,
ADD COLUMN currency TEXT DEFAULT 'USD',
ADD COLUMN total_tickets INTEGER,
ADD COLUMN available_tickets INTEGER,
ADD COLUMN status TEXT DEFAULT 'scheduled';

-- Add new columns to venues table
ALTER TABLE venues
ADD COLUMN timezone TEXT,
ADD COLUMN capacity INTEGER,
ADD COLUMN address TEXT,
ADD COLUMN postal_code TEXT,
ADD COLUMN url TEXT,
ADD COLUMN parking_info TEXT,
ADD COLUMN accessible_seating_info TEXT;

-- Add new columns to artists table
ALTER TABLE artists
ADD COLUMN bio TEXT,
ADD COLUMN monthly_listeners INTEGER,
ADD COLUMN verified BOOLEAN DEFAULT FALSE,
ADD COLUMN social_links TEXT[];

-- Create indexes for improved query performance
CREATE INDEX idx_shows_date ON shows (date);
CREATE INDEX idx_shows_price ON shows (min_price, max_price);
CREATE INDEX idx_shows_status ON shows (status);
CREATE INDEX idx_venues_location ON venues (city, state, country);
CREATE INDEX idx_venues_coordinates ON venues USING gist (
  ST_SetSRID(ST_MakePoint(CAST(longitude AS float8), CAST(latitude AS float8)), 4326)::geography
);
CREATE INDEX idx_artists_genres ON artists USING gin (genres);
CREATE INDEX idx_artists_popularity ON artists (popularity);

-- Add check constraints
ALTER TABLE shows
ADD CONSTRAINT shows_price_check CHECK (min_price <= max_price),
ADD CONSTRAINT shows_tickets_check CHECK (available_tickets <= total_tickets),
ADD CONSTRAINT shows_status_check CHECK (status IN ('scheduled', 'on-sale', 'sold-out', 'cancelled'));

-- Add PostGIS extension if not exists (for location-based queries)
CREATE EXTENSION IF NOT EXISTS postgis; 