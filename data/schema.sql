DROP TABLE IF EXISTS beers; 
DROP TABLE IF EXISTS brewery;
DROP TABLE IF EXISTS styles; 

CREATE TABLE IF NOT EXISTS beers(
  id SERIAL PRIMARY KEY, 
  time_stamp TIMESTAMP, 
  beer_id VARCHAR(100),
  abv DEC(5,3),
  usernote TEXT,
  userrate INT,
  style VARCHAR(255),
  style_id INT, 
  FOREIGN KEY(style_id) REFRENCES styles(id),
  brewery_id INT,
  FOREIGN KEY(brewery_id) REFRENCES brewery(id)
);

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