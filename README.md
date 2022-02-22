App in React and Typescript for scheduling music written with school local radio in mind.
Inspired by https://github.com/etiaro/LocalRadio

# How to set-up for development
dependencies:  
+ node.js: https://nodejs.org/en/  
+ ffmpeg: https://www.ffmpeg.org/download.html 

For linux you can just install them with a package manager of choice.
For windows download them from links and addd to path.
 
Then
1. set up mysql database ( for example with docker container ) and add its name to `ormconfig.js` in database field (or use `DB_NAME` environment variable)
1. instal npm packages with `npm install` in backend and frontend directory
1. start frontend with `npm start` and backend with `npm run dev`

Admin panel is accesible at /old and /users for now.
Default login credentials are admin admin. Remebmer to change them for production!

This should be all you need (at least I hope so...)

# Docker
Run `radio/build.sh`\
Then you can build a container using `radio/Dockerfile`
or make `docker-compose.yml` based on `example-docker-compose.yml`
