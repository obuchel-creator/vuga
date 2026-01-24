@echo off
REM Auto-commit and push all changes to GitHub
set /p MSG="Enter commit message: "
git add .
git commit -m "%MSG%"
git push
