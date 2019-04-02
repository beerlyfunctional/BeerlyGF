DROP TABLE IF EXISTS beers; 
DROP TABLE IF EXISTS brewery;
DROP TABLE IF EXISTS styles; 

CREATE TABLE IF NOT EXISTS brewery(
  id SERIAL PRIMARY KEY, 
  time_stamp TIMESTAMP,
  brewery VARCHAR(255), 
  location VARCHAR(255), 
  socialmedia VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS styles(
  id SERIAL PRIMARY KEY, 
  time_stamp TIMESTAMP,
  name VARCHAR(255), 
  description TEXT,
  ibumin INT, 
  ibumax INT
);

CREATE TABLE IF NOT EXISTS beers(
  id SERIAL PRIMARY KEY, 
  name VARCHAR(255),
  beer_id VARCHAR(100),
  abv DEC(5,3),
  style_name VARCHAR(255),
  style_id INT, 
  time_stamp TIMESTAMP, 
  usernote TEXT,
  userrate INT,
  FOREIGN KEY(style_id) REFERENCES styles(id),
  brewery_id INT,
  FOREIGN KEY(brewery_id) REFERENCES brewery(id)
);



