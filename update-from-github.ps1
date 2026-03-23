# Update DebluERP from GitHub
# Usage: .\update-from-github.ps1

Write-Host "=== Update from GitHub ===" -ForegroundColor Cyan
Set-Location $PSScriptRoot

Write-Host "`nFetching from GitHub..." -ForegroundColor Green
git fetch origin main
git reset --hard origin/main

Write-Host "`nnpm install..." -ForegroundColor Green
Set-Location client; npm install --silent; Set-Location ..
Set-Location server; npm install --silent; Set-Location ..

Write-Host "`nRunning database migrations..." -ForegroundColor Green
node server/scripts/migrate.js

Write-Host "`nBuilding frontend..." -ForegroundColor Green
Set-Location client; npm run build 2>&1 | Out-Null; Set-Location ..

Write-Host "`n=== Done ===" -ForegroundColor Green
Write-Host "Run server: cd server; npm start" -ForegroundColor Cyan
