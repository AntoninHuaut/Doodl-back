#!/bin/bash
echo 'Deploying...'
cd ../doodl-front/
git pull
npm install
npm run prod-build
echo 'OK'