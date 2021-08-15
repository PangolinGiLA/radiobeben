# How to setup:
dependencies:  
+ node.js: https://nodejs.org/en/  
+ ffmpeg: https://www.ffmpeg.org/download.html 
	
You need to add both to path, then:

1. set up databese ( for example with xampp and phpmyadmin ) and add its name to `ormconfig.json` in database field  
2. open new terminal in project directory  
3. `cd backend` then `npm install`  
4. `npm run dev` this should automatically create all tables in database  
5. you need to add some rows so aplication will by fully functional:  
+ add at least 1 row in days table (set the date to current date)
+ add one row in breaktimes table (in breaktimesJSON you need to put the json in table example:  
`[ { "start": { "hour": 8, "minutes": 10 }, "end": { "hour": 8, "minutes": 20 }} ]` )  
+ in schedule add days form 0 to 6
+ add user in users table (in pass you need to put hash of password, use `bcrypt.hash(your_pass, 10)` function);  
You might need to restart backend after that  
  
6. `mkdir Music`    
7. `cd ..` then `cd frontend`  
8. `npm install` then `npm start`   
	
This should be all you need (at least a hope so...)

Most of the code I wrote is not yet tested. I will do that after I develop frontend for that part of backend.