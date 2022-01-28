# How to set-up
dependencies:  
+ node.js: https://nodejs.org/en/  
+ ffmpeg: https://www.ffmpeg.org/download.html 
	
You need to add both to path, then:

1. set up mysql database ( for example with docker container ) and add its name to `ormconfig.js` in database field (or use `DB_NAME` environment variable)
1. open new terminal in project directory  
1. `cd backend` then `npm install`  
1. `npm start` this should automatically create all tables in database  
1. you need to add some rows so aplication will by fully functional:  
	+ add at least 1 row in days table (set the date to current date)
	+ add one row in breaktimes table\
	(in breaktimesJSON you need to put the json in table\
	example:  `[{"start":{"hour":8,"minutes": 10},"end":{"hour":8,"minutes":20}}]`)
	+ in schedule add days form 0 to 6
	+ default `admin` user will be automatically created with password `admin`

	You might need to restart backend after that

1. `mkdir Music`    
1. `cd ../frontend`  
1. `npm install` then `npm start`   
	
This should be all you need (at least I hope so...)

Most of the code I wrote is not yet tested. I will do that after I develop frontend for that part of backend.

# Docker
Run `radio/build.sh`\
Then you can build a container using `radio/Dockerfile`
or make `docker-compose.yml` based on `example-docker-compose.yml`
