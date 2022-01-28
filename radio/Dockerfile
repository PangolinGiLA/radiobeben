FROM node:16
RUN npm i -g ffbinaries
RUN ffbinaries ffmpeg ffplay -q -v=3.2 -o=/usr/local/bin
ENV FFMPEG_PATH="/usr/local/bin/ffmpeg" FFPLAY_PATH="/usr/local/bin/ffplay"
RUN npm r -g ffbinaries
WORKDIR /usr/src/app
COPY build/package*.json ./
RUN npm install --production
COPY build/. .
CMD [ "npm", "run", "container-run" ]
