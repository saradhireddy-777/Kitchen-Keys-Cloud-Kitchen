@echo off
set "PATH=%~dp0node-bin;%PATH%"
echo Starting KitchenKeys Cloud Kitchen Server...
node server.js
pause
