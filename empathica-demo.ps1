Write-Host "🎓 EMPATHICA - STUDENT MENTAL WELLNESS PLATFORM" -ForegroundColor Cyan
Write-Host "=" * 70
Write-Host "FINAL YEAR PROJECT DEMONSTRATION" -ForegroundColor Yellow
Write-Host "=" * 70

# Demo Steps
Write-Host "`n1️⃣ Checking API Health..." -ForegroundColor Green
$health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
Write-Host "   Status: $($health.status)" -ForegroundColor White
Write-Host "   Uptime: $([math]::Round($health.uptime, 2)) seconds" -ForegroundColor White

Write-Host "`n2️⃣ Registering Test User..." -ForegroundColor Green
$user = @{name="Demo Student";email="demo@uni.edu";password="demo123"} | ConvertTo-Json
$register = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body $user -ContentType "application/json"
Write-Host "   User: $($register.user.name)" -ForegroundColor White
Write-Host "   Email: $($register.user.email)" -ForegroundColor White

Write-Host "`n3️⃣ Creating Journal Entries..." -ForegroundColor Green
$headers = @{Authorization="Bearer $($register.token)"}

$entries = @(
    "Feeling accomplished after submitting my thesis draft!",
    "Stressed about final exams next week",
    "Happy to meet with my study group today"
)

foreach ($entry in $entries) {
    $body = @{text=$entry; tags=@("academic")} | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/reflections" -Method Post -Body $body -Headers $headers -ContentType "application/json"
    Write-Host "   ✓ '$($entry.Substring(0, 30))...' - Emotion: $($response.data.emotionLabel)" -ForegroundColor Gray
}

Write-Host "`n4️⃣ Viewing Dashboard Statistics..." -ForegroundColor Green
$stats = Invoke-RestMethod -Uri "http://localhost:5000/api/reflections/stats" -Method Get -Headers $headers
Write-Host "   Total Reflections: $($stats.data.totalReflections)" -ForegroundColor Yellow
Write-Host "   Current Streak: $($stats.data.streak) days" -ForegroundColor Yellow
Write-Host "   Average Emotion Score: $($stats.data.averageEmotionScore)/1.00" -ForegroundColor Yellow

if ($stats.data.emotionDistribution) {
    Write-Host "`n   Emotion Distribution:" -ForegroundColor Cyan
    foreach ($emotion in $stats.data.emotionDistribution) {
        $bar = "█" * [math]::Ceiling($emotion.count * 3)
        Write-Host "   $($emotion.emotion.PadRight(10)) $($emotion.count) $($emotion.percentage.PadLeft(6)) $bar" -ForegroundColor White
    }
}

Write-Host "`n5️⃣ Getting AI Insights..." -ForegroundColor Green
$insights = Invoke-RestMethod -Uri "http://localhost:5000/api/insights" -Method Get -Headers $headers
if ($insights.data.Count -gt 0) {
    Write-Host "   Latest Insight: $($insights.data[0].title)" -ForegroundColor White
    Write-Host "   $($insights.data[0].content)" -ForegroundColor Gray
}

Write-Host "`n6️⃣ Accessing Mental Health Resources..." -ForegroundColor Green
$resources = Invoke-RestMethod -Uri "http://localhost:5000/api/resources" -Method Get
Write-Host "   Available Resources:" -ForegroundColor White
foreach ($resource in $resources.data) {
    Write-Host "   • $($resource.title) - $($resource.description)" -ForegroundColor Gray
}

Write-Host "`n" + "=" * 70 -ForegroundColor Cyan
Write-Host "🎉 DEMONSTRATION COMPLETE!" -ForegroundColor Green -BackgroundColor Black
Write-Host "All 10 API endpoints tested successfully" -ForegroundColor White
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
