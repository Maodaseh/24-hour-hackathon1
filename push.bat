@echo off
set GIT="C:\Program Files\Git\cmd\git.exe"
%GIT% config user.name "Maodaseh"
%GIT% config user.email "maodaseh@users.noreply.github.com"
%GIT% add .
%GIT% commit -m "first commit"
%GIT% branch -M main
%GIT% remote remove origin 2>nul
%GIT% remote add origin https://github.com/Maodaseh/24-hour-hackathon1.git
%GIT% push -u origin main
