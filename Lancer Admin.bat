@echo off
title FleurMat Admin
cd /d "%~dp0"
echo Mise a jour du projet...
git pull
cd admin
npm run dev
pause
