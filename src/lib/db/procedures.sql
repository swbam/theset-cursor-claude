-- Increment song votes
CREATE OR REPLACE FUNCTION increment_song_votes(song_id UUID, vote_value INT)
RETURNS VOID AS $$
BEGIN
  UPDATE setlist_songs
  SET votes = votes + vote_value
  WHERE id = song_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement song votes
CREATE OR REPLACE FUNCTION decrement_song_votes(song_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE setlist_songs
  SET votes = GREATEST(votes - 1, 0)
  WHERE id = song_id;
END;
$$ LANGUAGE plpgsql;

-- Get top voted songs for a show
CREATE OR REPLACE FUNCTION get_top_voted_songs(show_id_param UUID, limit_param INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  title TEXT,
  artist_name TEXT,
  votes INT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id,
    ss.title,
    ss.artist_name,
    ss.votes,
    ss.created_at
  FROM 
    setlist_songs ss
  WHERE 
    ss.show_id = show_id_param
  ORDER BY 
    ss.votes DESC
  LIMIT 
    limit_param;
END;
$$ LANGUAGE plpgsql;

-- Get shows with most votes
CREATE OR REPLACE FUNCTION get_shows_with_most_votes(limit_param INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name TEXT,
  date TIMESTAMP,
  venue_id UUID,
  artist_id UUID,
  total_votes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.date,
    s.venue_id,
    s.artist_id,
    COALESCE(SUM(ss.votes), 0) AS total_votes
  FROM 
    shows s
  LEFT JOIN 
    setlist_songs ss ON s.id = ss.show_id
  GROUP BY 
    s.id
  ORDER BY 
    total_votes DESC
  LIMIT 
    limit_param;
END;
$$ LANGUAGE plpgsql;

-- Get user's voted shows
CREATE OR REPLACE FUNCTION get_user_voted_shows(user_id_param UUID, limit_param INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name TEXT,
  date TIMESTAMP,
  venue_id UUID,
  artist_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    s.id,
    s.name,
    s.date,
    s.venue_id,
    s.artist_id
  FROM 
    shows s
  JOIN 
    votes v ON s.id = v.show_id
  WHERE 
    v.user_id = user_id_param
  ORDER BY 
    s.date DESC
  LIMIT 
    limit_param;
END;
$$ LANGUAGE plpgsql;

-- Get user's suggested shows
CREATE OR REPLACE FUNCTION get_user_suggested_shows(user_id_param UUID, limit_param INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name TEXT,
  date TIMESTAMP,
  venue_id UUID,
  artist_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    s.id,
    s.name,
    s.date,
    s.venue_id,
    s.artist_id
  FROM 
    shows s
  JOIN 
    setlist_songs ss ON s.id = ss.show_id
  WHERE 
    ss.suggested_by = user_id_param
  ORDER BY 
    s.date DESC
  LIMIT 
    limit_param;
END;
$$ LANGUAGE plpgsql; 