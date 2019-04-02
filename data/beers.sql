DROP TABLE IF EXISTS beers; 
DROP TABLE IF EXISTS breweries;
DROP TABLE IF EXISTS styles;
DROP TABLE IF EXISTS ratings; 

CREATE TABLE IF NOT EXISTS breweries(
  id VARCHAR(32) PRIMARY KEY,  -- pulled from API data
  brewery VARCHAR(255), -- name of brewery
  website VARCHAR(255),
  time_stamp TIMESTAMP,
  location VARCHAR(255), 
  image VARCHAR(511)
);

CREATE TABLE IF NOT EXISTS styles(
  id INT PRIMARY KEY,  -- pulled from API data
  time_stamp TIMESTAMP,
  name VARCHAR(255), 
  description TEXT,
  abvmin DEC(5,3),
  abvmax DEC(5,3),
  ibumin INT, 
  ibumax INT
);

CREATE TABLE IF NOT EXISTS ratings(
  id SERIAL PRIMARY KEY, 
  usernote TEXT,
  userrating INT,
  numvotes INT,
);

CREATE TABLE IF NOT EXISTS beers(
  id SERIAL PRIMARY KEY, 
  name VARCHAR(255),
  beer_id VARCHAR(100),
  abv DEC(5,3),
  ibu INT,
  time_stamp TIMESTAMP, 
  rating_id INT,
  brewery_id VARCHAR(32),
  style_id INT,
  FOREIGN KEY(style_id) REFERENCES styles(id),
  FOREIGN KEY(brewery_id) REFERENCES breweries(id),
  FOREIGN KEY(rating_id) REFERENCES ratings(id) 
);



