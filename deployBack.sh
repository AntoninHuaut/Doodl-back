#!/bin/bash
echo 'Deploying...'
git pull
pm2 restart "doodl-back"
echo 'OK'