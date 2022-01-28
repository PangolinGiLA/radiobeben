#!/bin/bash
set -e
echo "removing build directory"
rm -rf ./build
mkdir ./build

echo "building backend"
cd ../backend
npm i
npm run build
cd ..
cp -r ./backend/build/ ./radio/build/src/
cp ./backend/package.json ./backend/package-lock.json ./backend/ormconfig.js ./radio/build/

echo "building frontend"
cd ./frontend
npm i
npm run build
cd ..
cp -r ./frontend/build/ ./radio/build/src/public/
