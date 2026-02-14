# ============================================
# EMPATHICA API TEST SCRIPT
# Save as: test-empathica.ps1
# Run with: .\test-empathica.ps1
# ============================================

Write-Host "🧪 TESTING ALL EMPATHICA ENDPOINTS" -ForegroundColor Cyan
Write-Host "=" * 70

# 1. Test Health Endpoint
Write-Host "`n1️⃣ /api/health" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get -ErrorAction Stop
    Write-Host "   ✅ SUCCESS: $($health.message)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Test Registration
Write-Host "`n2️⃣ /api/auth/register" -ForegroundColor Yellow
$registerBody = @{
    name = "Test Student"
    email = "test.student@university.edu"
    password = "Password123!"
} | ConvertTo-Json

try {
    $register = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json" -ErrorAction Stop
    $token = $register.token
    $headers = @{Authorization = "Bearer $token"}
    Write-Host "   ✅ Registered: $($register.user.name)" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 30))..." -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 3. Test Profile
Write-Host "`n3️⃣ /api/auth/me" -ForegroundColor Yellow
try {
    $profile = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "   ✅ Profile: $($profile.user.email)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Profile failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Create Test Reflections
Write-Host "`n4️⃣ /api/reflections (Create entries)" -ForegroundColor Yellow
$testReflections = @(
    @{
        text = "Feeling great about my project progress! Submitted everything on time. Happy with my work."
        tags = @("academic", "achievement", "project")
    },
    @{
        text = "Stressed about upcoming exams. Need to study more but feeling overwhelmed."
        tags = @("academic", "stress", "exams")
    },
    @{
        text = "Had a wonderful time with friends today. Good social support helps with stress."
        tags = @("social", "friends", "support")
    },
    @{
        text = "Feeling anxious about the presentation tomorrow. Hope it goes well."
        tags = @("academic", "anxiety", "presentation")
    },
    @{
        text = "Missing family today. Feeling a bit lonely in the dorm."
        tags = @("personal", "family", "lonely")
    }
)

$createdCount = 0
foreach ($reflection in $testReflections) {
    $body = $reflection | ConvertTo-Json
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/reflections" -Method Post -Body $body -Headers $headers -ContentType "application/json" -ErrorAction Stop
        $createdCount++
        Write-Host "   Created reflection with emotion: $($response.data.emotion)" -ForegroundColor Gray
    } catch {
        Write-Host "   Failed to create reflection: $($_.Exception.Message)" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 300
}

# 5. Get All Reflections
Write-Host "`n5️⃣ /api/reflections (Get all)" -ForegroundColor Yellow
try {
    $allReflections = Invoke-RestMethod -Uri "http://localhost:5000/api/reflections" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "   ✅ Total reflections: $($allReflections.data.Count)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to get reflections: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. TEST THE CRITICAL ENDPOINT: Dashboard Statistics
Write-Host "`n6️⃣ /api/reflections/stats (DASHBOARD)" -ForegroundColor Yellow -BackgroundColor DarkBlue
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:5000/api/reflections/stats" -Method Get -Headers $headers -ErrorAction Stop
    
    Write-Host "   ✅ DASHBOARD STATISTICS WORKING!" -ForegroundColor Green -BackgroundColor Black
    Write-Host "`n   📊 DASHBOARD DATA:" -ForegroundColor Cyan
    Write-Host "   Total Reflections: $($stats.data.totalReflections)" -ForegroundColor White
    Write-Host "   Current Streak: $($stats.data.streak) days" -ForegroundColor White
    Write-Host "   Average Mood Score: $($stats.data.averageMoodScore)/1.00" -ForegroundColor White
    
    Write-Host "`n   🎭 EMOTION DISTRIBUTION:" -ForegroundColor Cyan
    if ($stats.data.emotionDistribution -and $stats.data.emotionDistribution.Count -gt 0) {
        foreach ($emotion in $stats.data.emotionDistribution) {
            $bar = "█" * [math]::Ceiling($emotion.count)
            Write-Host "   $($emotion.emotion.PadRight(10)) $($emotion.count.ToString().PadLeft(2)) $($emotion.percentage.PadLeft(6)) $bar" -ForegroundColor White
        }
    } else {
        Write-Host "   No emotion data yet" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ STATS ENDPOINT FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Test AI Insights
Write-Host "`n7️⃣ /api/insights" -ForegroundColor Yellow
try {
    $insights = Invoke-RestMethod -Uri "http://localhost:5000/api/insights" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "   ✅ Insights: $($insights.count) generated" -ForegroundColor Green
    if ($insights.data -and $insights.data.Count -gt 0) {
        Write-Host "   Latest: $($insights.data[0].title)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Insights failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 8. Test Mental Health Resources
Write-Host "`n8️⃣ /api/resources" -ForegroundColor Yellow
try {
    $resources = Invoke-RestMethod -Uri "http://localhost:5000/api/resources" -Method Get -ErrorAction Stop
    Write-Host "   ✅ Resources: $($resources.count) categories" -ForegroundColor Green
    if ($resources.data) {
        foreach ($resource in $resources.data) {
            Write-Host "   • $($resource.title)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   ❌ Resources failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 9. Test Login with credentials
Write-Host "`n9️⃣ /api/auth/login" -ForegroundColor Yellow
$loginBody = @{
    email = "test.student@university.edu"
    password = "Password123!"
} | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "   ✅ Login successful: $($login.user.email)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# SUMMARY
Write-Host "`n" + "=" * 70 -ForegroundColor Cyan
Write-Host "📋 TEST SUMMARY" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Cyan

$testResults = @(
    @{Name="1. Health Check"; Status=$health -ne $null},
    @{Name="2. User Registration"; Status=$register -ne $null},
    @{Name="3. Get Profile"; Status=$profile -ne $null},
    @{Name="4. Create Reflections"; Status=$createdCount -gt 0},
    @{Name="5. Get Reflections"; Status=$allReflections -ne $null},
    @{Name="6. Dashboard Statistics"; Status=$stats -ne $null},
    @{Name="7. AI Insights"; Status=$insights -ne $null},
    @{Name="8. Mental Health Resources"; Status=$resources -ne $null},
    @{Name="9. User Login"; Status=$login -ne $null}
)

$passed = 0
foreach ($test in $testResults) {
    if ($test.Status) {
        Write-Host "✅ $($test.Name)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "❌ $($test.Name)" -ForegroundColor Red
    }
}

Write-Host "`n🎯 RESULTS: $passed/9 tests passed" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Cyan

if ($passed -eq 9) {
    Write-Host "🎉 CONGRATULATIONS! EMPATHICA BACKEND IS 100% WORKING!" -ForegroundColor Green -BackgroundColor Black
    Write-Host "🚀 Ready for Phase 2: AI Engine & Frontend Development" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Some tests failed. Check the errors above." -ForegroundColor Yellow
}

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
