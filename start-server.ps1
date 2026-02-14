# start-server.ps1
Write-Host "🚀 Starting Empathica Backend Server..." -ForegroundColor Cyan
Write-Host "=" * 60

# Change to API directory
Set-Location -Path ".\api"

# Check if node_modules exists
if (-not (Test-Path ".\node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check MongoDB connection
Write-Host "🗄️  Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongoTest = Test-NetConnection -ComputerName localhost -Port 27017
    if ($mongoTest.TcpTestSucceeded) {
        Write-Host "   ✅ MongoDB is running on port 27017" -ForegroundColor Green
    } else {
        Write-Host "   ❌ MongoDB is not running!" -ForegroundColor Red
        Write-Host "   Please start MongoDB first:" -ForegroundColor Yellow
        Write-Host "   1. Open MongoDB Compass and connect" -ForegroundColor White
        Write-Host "   2. Or run: net start MongoDB" -ForegroundColor White
        Write-Host "   3. Or run: mongod --dbpath 'C:\data\db'" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "   ❌ Could not check MongoDB: $_" -ForegroundColor Red
}

# Start the server
Write-Host "🚀 Starting Node.js server..." -ForegroundColor Yellow
Write-Host "   Server will run at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host "=" * 60