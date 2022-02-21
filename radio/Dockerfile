FROM ubuntu:20.04

RUN apt-get -y update && apt-get -y upgrade && apt-get -y install curl ffmpeg
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get -y install nodejs

ENV FFPLAY_PATH="ffplay"

WORKDIR /usr/src/app
COPY build/package*.json ./
RUN npm install --production
COPY build/. .
CMD [ "npm", "run", "container-run" ]
