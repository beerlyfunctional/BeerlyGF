DROP TABLE IF EXISTS beers; 
DROP TABLE IF EXISTS styles; 

CREATE TABLE IF NOT EXISTS beers(
  id SERIAL PRIMARY KEY, 
  beer_id VARCHAR(100),
  brewery VARCHAR(255),
  abv DEC(5,3),
  usernote TEXT,
  userrate INT,
  style VARCHAR(255),
  style_id INT, 
  FOREIGN KEY(style_id) REFRENCES styles(id)
);

CREATE TABLE IF NOT EXISTS styles(
  id SERIAL PRIMARY KEY, 
  name VARCHAR(255), 
  description TEXT,
  ibumin INT, 
  ibumax INT
);