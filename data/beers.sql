DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS beers; 
DROP TABLE IF EXISTS styles;
DROP TABLE IF EXISTS breweries;
DROP TABLE IF EXISTS locations;

CREATE TABLE IF NOT EXISTS locations(
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(127),
  lat NUMERIC (16,14),
  long NUMERIC (17,14)
);

CREATE TABLE IF NOT EXISTS breweries(
  id VARCHAR(32) PRIMARY KEY,  -- pulled from API data
  brewery VARCHAR(255), -- name of brewery
  website VARCHAR(255),
  image VARCHAR(511),
  lat NUMERIC (16,14),
  long NUMERIC (17,14),
  time_stamp NUMERIC(35),
  location_id int NOT NULL, 
  FOREIGN KEY(location_id) REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS styles(
  id INT PRIMARY KEY,  -- pulled from API data
  name VARCHAR(255), 
  description TEXT,
  abvmin DEC(5,3),
  abvmax DEC(5,3),
  ibumin INT, 
  ibumax INT,
  time_stamp NUMERIC(35)
);

CREATE TABLE IF NOT EXISTS beers(
  id SERIAL PRIMARY KEY, 
  name VARCHAR(255),
  beer_id VARCHAR(100) UNIQUE,
  abv DEC(5,3),
  ibu INT,
  time_stamp NUMERIC(35),
  style_id INT,
  brewery_id VARCHAR(32),
  FOREIGN KEY(style_id) REFERENCES styles(id),
  FOREIGN KEY(brewery_id) REFERENCES breweries(id)
);

CREATE TABLE IF NOT EXISTS reviews(
  id SERIAL PRIMARY KEY,
  beer_id VARCHAR(100) NOT NULL,
  note TEXT,
  rating INT,
  time_stamp NUMERIC(35),
  gf BOOLEAN,
  FOREIGN KEY (beer_id) REFERENCES beers(beer_id)
);
