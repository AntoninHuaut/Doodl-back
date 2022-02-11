#!/bin/bash
echo 'Deploying...'
cd ../doodl-front/
git pull
npm install
npm run build
echo 'OK'