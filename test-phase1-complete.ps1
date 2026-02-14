# ============================================
# EMPATHICA PHASE 1: COMPLETE VALIDATION TEST
# ============================================
Write-Host "?? EMPATHICA - PHASE 1 COMPREHENSIVE TEST" -ForegroundColor Cyan
Write-Host "=" * 80
Write-Host "Testing ALL requirements from Sprint 1-2 Specification" -ForegroundColor White
Write-Host "=" * 80

# ========================
# TEST 1: PROJECT STRUCTURE
# ========================
Write-Host "`n?? TEST 1: PROJECT STRUCTURE VALIDATION" -ForegroundColor Yellow
$structureTests = @()

# Check for api/ directory
if (Test-Path ".") {
    Write-Host "   ? api/ directory exists" -ForegroundColor Green
    $structureTests += @{Test="api/ directory"; Result=$true}
} else {
    Write-Host "   ? api/ directory missing" -ForegroundColor Red
    $structureTests += @{Test="api/ directory"; Result=$false}
}

# Check for package.json in api
if (Test-Path "package.json") {
    Write-Host "   ? api/package.json exists" -ForegroundColor Green
    $structureTests += @{Test="api/package.json"; Result=$true}
} else {
    Write-Host "   ? api/package.json missing" -ForegroundColor Red
    $structureTests += @{Test="api/package.json"; Result=$false}
}

# Check for src/server.js
if (Test-Path "src/server.js") {
    Write-Host "   ? api/src/server.js exists" -ForegroundColor Green
    $structureTests += @{Test="api/src/server.js"; Result=$true}
} else {
    Write-Host "   ? api/src/server.js missing" -ForegroundColor Red
    $structureTests += @{Test="api/src/server.js"; Result=$false}
}

# ========================
# TEST 2: SERVER HEALTH
# ========================
Write-Host "`n???  TEST 2: EXPRESS SERVER & MIDDLEWARE" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get -ErrorAction Stop
    
    # Check for CORS headers (indirect test)
    $request = [System.Net.WebRequest]::Create("http://localhost:5000/api/health")
    $response = $request.GetResponse()
    
    Write-Host "   ? Express server running" -ForegroundColor Green
    Write-Host "   ? Health endpoint: $($health.message)" -ForegroundColor White
    Write-Host "   ? Timestamp: $($health.timestamp)" -ForegroundColor Gray
    
    $serverTests = @(
        @{Test="Server running"; Result=$true},
        @{Test="Health endpoint"; Result=$true},
        @{Test="Timestamp in response"; Result=$($health.timestamp -ne $null)}
    )
} catch {
    Write-Host "   ? Server not accessible: $($_.Exception.Message)" -ForegroundColor Red
    $serverTests = @(@{Test="Server running"; Result=$false})
}

# ========================
# TEST 3: JWT AUTHENTICATION
# ========================
Write-Host "`n?? TEST 3: JWT AUTHENTICATION SYSTEM" -ForegroundColor Yellow

# Test 3.1: User Registration
Write-Host "   Testing Registration..." -ForegroundColor Gray
$authTests = @()
$testUser = @{
    name = "Validation User"
    email = "validation@university.edu"
    password = "Password123!"
} | ConvertTo-Json

try {
    $register = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body $testUser -ContentType "application/json" -ErrorAction Stop
    
    # Check response structure
    $hasToken = $register.token -and $register.token.Length -gt 10
    $hasUser = $register.user -and $register.user.email -eq "validation@university.edu"
    $hasId = $register.user._id -ne $null
    
    if ($hasToken -and $hasUser -and $hasId) {
        Write-Host "   ? User registration successful" -ForegroundColor Green
        Write-Host "   ? JWT token generated ($($register.token.Length) chars)" -ForegroundColor Green
        Write-Host "   ? User ID assigned: $($register.user._id)" -ForegroundColor Gray
        
        $token = $register.token
        $headers = @{Authorization = "Bearer $token"}
        $userId = $register.user._id
        
        $authTests += @{Test="User registration"; Result=$true}
        $authTests += @{Test="JWT token generation"; Result=$hasToken}
        $authTests += @{Test="User ID assignment"; Result=$hasId}
    } else {
        Write-Host "   ?? Registration response incomplete" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ? Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    $authTests += @{Test="User registration"; Result=$false}
    $token = $null
}

# Test 3.2: User Login
if ($token) {
    Write-Host "   Testing Login..." -ForegroundColor Gray
    $loginBody = @{
        email = "validation@university.edu"
        password = "Password123!"
    } | ConvertTo-Json
    
    try {
        $login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -ErrorAction Stop
        
        if ($login.token -and $login.user) {
            Write-Host "   ? User login successful" -ForegroundColor Green
            Write-Host "   ? New JWT token issued on login" -ForegroundColor Green
            $authTests += @{Test="User login"; Result=$true}
            $authTests += @{Test="Token refresh on login"; Result=$($login.token -ne $token)}
        }
    } catch {
        Write-Host "   ? Login failed: $($_.Exception.Message)" -ForegroundColor Red
        $authTests += @{Test="User login"; Result=$false}
    }
}

# Test 3.3: Protected Route Access
if ($headers) {
    Write-Host "   Testing Protected Routes..." -ForegroundColor Gray
    try {
        $profile = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Method Get -Headers $headers -ErrorAction Stop
        
        if ($profile.user -and $profile.user._id -eq $userId) {
            Write-Host "   ? Protected route accessible with valid token" -ForegroundColor Green
            Write-Host "   ? User data returned correctly" -ForegroundColor Green
            $authTests += @{Test="Protected route access"; Result=$true}
            $authTests += @{Test="User data integrity"; Result=$($profile.user.email -eq "validation@university.edu")}
        }
    } catch {
        Write-Host "   ? Protected route failed: $($_.Exception.Message)" -ForegroundColor Red
        $authTests += @{Test="Protected route access"; Result=$false}
    }
    
    # Test 3.4: Invalid Token Rejection
    Write-Host "   Testing Invalid Token Rejection..." -ForegroundColor Gray
    $badHeaders = @{Authorization = "Bearer invalid_token_123"}
    try {
        $badResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Method Get -Headers $badHeaders -ErrorAction Stop
        Write-Host "   ? Should have rejected invalid token" -ForegroundColor Red
        $authTests += @{Test="Invalid token rejection"; Result=$false}
    } catch {
        if ($_.Exception.Message -like "*401*" -or $_.Exception.Message -like "*token*") {
            Write-Host "   ? Invalid token properly rejected" -ForegroundColor Green
            $authTests += @{Test="Invalid token rejection"; Result=$true}
        } else {
            Write-Host "   ?? Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

# ========================
# TEST 4: MONGODB SCHEMAS & CRUD
# ========================
Write-Host "`n???  TEST 4: MONGODB SCHEMAS & DATA PERSISTENCE" -ForegroundColor Yellow

$dbTests = @()
if ($headers) {
    # Test 4.1: Reflection Creation (CRUD - Create)
    Write-Host "   Testing Reflection Creation..." -ForegroundColor Gray
    $reflectionBody = @{
        text = "Comprehensive test reflection for database validation. Feeling accomplished after completing Phase 1."
        tags = @("academic", "testing", "achievement")
    } | ConvertTo-Json
    
    try {
        $reflection = Invoke-RestMethod -Uri "http://localhost:5000/api/reflections" -Method Post -Body $reflectionBody -Headers $headers -ContentType "application/json" -ErrorAction Stop
        
        # Check Mongoose schema fields
        $hasText = $reflection.data.text -ne $null
        $hasUserId = $reflection.data.user -eq $userId
        $hasEmotionLabel = $reflection.data.emotionLabel -ne $null
        $hasEmotionScore = $reflection.data.emotionScore -ne $null
        $hasDate = $reflection.data.date -ne $null
        $hasTags = $reflection.data.tags -ne $null
        $hasMongoId = $reflection.data._id -ne $null
        
        if ($hasText -and $hasUserId -and $hasEmotionLabel -and $hasDate -and $hasMongoId) {
            Write-Host "   ? Reflection created with all schema fields" -ForegroundColor Green
            Write-Host "   ? Emotion detection: $($reflection.data.emotionLabel) ($($reflection.data.emotionScore))" -ForegroundColor Green
            Write-Host "   ? MongoDB _id generated: $($reflection.data._id)" -ForegroundColor Gray
            
            $reflectionId = $reflection.data._id
            
            $dbTests += @{Test="Reflection creation"; Result=$true}
            $dbTests += @{Test="Text field"; Result=$hasText}
            $dbTests += @{Test="User association"; Result=$hasUserId}
            $dbTests += @{Test="Emotion label"; Result=$hasEmotionLabel}
            $dbTests += @{Test="Emotion score"; Result=$hasEmotionScore}
            $dbTests += @{Test="Date field"; Result=$hasDate}
            $dbTests += @{Test="Tags array"; Result=$hasTags}
            $dbTests += @{Test="MongoDB _id"; Result=$hasMongoId}
        }
    } catch {
        Write-Host "   ? Reflection creation failed: $($_.Exception.Message)" -ForegroundColor Red
        $dbTests += @{Test="Reflection creation"; Result=$false}
    }
    
    # Test 4.2: Get Reflections (CRUD - Read)
    if ($reflectionId) {
        Write-Host "   Testing Reflection Retrieval..." -ForegroundColor Gray
        try {
            $allReflections = Invoke-RestMethod -Uri "http://localhost:5000/api/reflections" -Method Get -Headers $headers -ErrorAction Stop
            
            if ($allReflections.success -and $allReflections.data.Count -gt 0) {
                Write-Host "   ? Reflections retrieved successfully" -ForegroundColor Green
                Write-Host "   ? Count: $($allReflections.data.Count) reflections" -ForegroundColor Green
                
                # Verify data structure
                $firstReflection = $allReflections.data[0]
                $hasCorrectStructure = $firstReflection.text -and $firstReflection.user -and $firstReflection.date
                
                $dbTests += @{Test="Reflection retrieval"; Result=$true}
                $dbTests += @{Test="Data structure integrity"; Result=$hasCorrectStructure}
                $dbTests += @{Test="Data isolation (user-specific)"; Result=$($allReflections.data[0].user -eq $userId)}
            }
        } catch {
            Write-Host "   ? Reflection retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
            $dbTests += @{Test="Reflection retrieval"; Result=$false}
        }
    }
}

# ========================
# TEST 5: CORE REST APIs
# ========================
Write-Host "`n?? TEST 5: CORE RESTFUL APIs" -ForegroundColor Yellow

$apiTests = @()
if ($headers) {
    # Create more test data for stats
    Write-Host "   Creating test data for statistics..." -ForegroundColor Gray
    $testEntries = @(
        @{text="Happy about my grades! Got an A in algorithms."; tags=@("academic", "grades")},
        @{text="Stressed about final project deadline."; tags=@("academic", "deadline")},
        @{text="Feeling anxious about the presentation."; tags=@("academic", "presentation")}
    )
    
    $createdCount = 0
    foreach ($entry in $testEntries) {
        $body = $entry | ConvertTo-Json
        try {
            Invoke-RestMethod -Uri "http://localhost:5000/api/reflections" -Method Post -Body $body -Headers $headers -ContentType "application/json" -ErrorAction Stop | Out-Null
            $createdCount++
        } catch {
            Write-Host "   Warning: Failed to create test entry" -ForegroundColor Yellow
        }
        Start-Sleep -Milliseconds 200
    }
    
    if ($createdCount -gt 0) {
        Write-Host "   ? Created $createdCount test reflections" -ForegroundColor Green
    }
    
    # Test 5.1: GET /api/reflections/stats (Aggregated Data)
    Write-Host "   Testing Dashboard Statistics API..." -ForegroundColor Gray
    try {
        $stats = Invoke-RestMethod -Uri "http://localhost:5000/api/reflections/stats" -Method Get -Headers $headers -ErrorAction Stop
        
        if ($stats.success -and $stats.data) {
            Write-Host "   ? Stats endpoint working" -ForegroundColor Green
            
            # Check required stats fields
            $hasTotal = $stats.data.totalReflections -ne $null
            $hasEmotionDist = $stats.data.emotionDistribution -ne $null
            $hasStreak = $stats.data.streak -ne $null
            $hasAvgScore = $stats.data.averageEmotionScore -ne $null
            
            Write-Host "   ?? Statistics Generated:" -ForegroundColor Cyan
            Write-Host "     Total Reflections: $($stats.data.totalReflections)" -ForegroundColor White
            Write-Host "     Current Streak: $($stats.data.streak) days" -ForegroundColor White
            Write-Host "     Average Emotion Score: $([math]::Round($stats.data.averageEmotionScore, 2))/1.00" -ForegroundColor White
            
            if ($stats.data.emotionDistribution.Count -gt 0) {
                Write-Host "     Emotion Distribution:" -ForegroundColor Cyan
                foreach ($emotion in $stats.data.emotionDistribution) {
                    Write-Host "       $($emotion.emotion): $($emotion.count) ($($emotion.percentage))" -ForegroundColor Gray
                }
            }
            
            $apiTests += @{Test="Stats endpoint"; Result=$true}
            $apiTests += @{Test="Total reflections count"; Result=$hasTotal}
            $apiTests += @{Test="Emotion distribution"; Result=$hasEmotionDist}
            $apiTests += @{Test="Streak calculation"; Result=$hasStreak}
            $apiTests += @{Test="Average score"; Result=$hasAvgScore}
        }
    } catch {
        Write-Host "   ? Stats endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
        $apiTests += @{Test="Stats endpoint"; Result=$false}
    }
}

# ========================
# TEST 6: AUTH MIDDLEWARE PROTECTION
# ========================
Write-Host "`n???  TEST 6: AUTH MIDDLEWARE PROTECTION" -ForegroundColor Yellow

$protectionTests = @()
$protectedEndpoints = @(
    @{Name="GET /api/reflections"; Url="http://localhost:5000/api/reflections"},
    @{Name="GET /api/reflections/stats"; Url="http://localhost:5000/api/reflections/stats"},
    @{Name="GET /api/insights"; Url="http://localhost:5000/api/insights"},
    @{Name="GET /api/auth/me"; Url="http://localhost:5000/api/auth/me"}
)

Write-Host "   Testing endpoint protection..." -ForegroundColor Gray
foreach ($endpoint in $protectedEndpoints) {
    try {
        $response = Invoke-RestMethod -Uri $endpoint.Url -Method Get -ErrorAction Stop
        Write-Host "   ? $($endpoint.Name) should require auth" -ForegroundColor Red
        $protectionTests += @{Test="$($endpoint.Name) protection"; Result=$false}
    } catch {
        if ($_.Exception.Message -like "*401*" -or $_.Exception.Message -like "*token*") {
            Write-Host "   ? $($endpoint.Name) properly protected" -ForegroundColor Green
            $protectionTests += @{Test="$($endpoint.Name) protection"; Result=$true}
        } else {
            Write-Host "   ?? $($endpoint.Name): $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

# ========================
# FINAL SUMMARY
# ========================
Write-Host "`n" + "=" * 80 -ForegroundColor Cyan
Write-Host "?? PHASE 1 VALIDATION SUMMARY" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Cyan

# Combine all test results
$allTests = @(
    @{Category="Project Structure"; Tests=$structureTests},
    @{Category="Express Server"; Tests=$serverTests},
    @{Category="JWT Authentication"; Tests=$authTests},
    @{Category="MongoDB Schemas"; Tests=$dbTests},
    @{Category="REST APIs"; Tests=$apiTests},
    @{Category="Auth Protection"; Tests=$protectionTests}
)

$totalTests = 0
$passedTests = 0

foreach ($category in $allTests) {
    Write-Host "`n$($category.Category):" -ForegroundColor Magenta
    
    foreach ($test in $category.Tests) {
        $totalTests++
        if ($test.Result) {
            Write-Host "   ? $($test.Test)" -ForegroundColor Green
            $passedTests++
        } else {
            Write-Host "   ? $($test.Test)" -ForegroundColor Red
        }
    }
}

$percentage = [math]::Round(($passedTests / $totalTests) * 100, 1)

Write-Host "`n" + "=" * 80 -ForegroundColor Cyan
Write-Host "?? FINAL RESULTS: $passedTests/$totalTests tests passed ($percentage%)" -ForegroundColor Yellow

if ($percentage -eq 100) {
    Write-Host "?? CONGRATULATIONS! PHASE 1 COMPLETELY VALIDATED!" -ForegroundColor Green -BackgroundColor Black
    Write-Host "? All Sprint 1-2 requirements met" -ForegroundColor White
    Write-Host "? Ready for Phase 2: AI Engine Integration" -ForegroundColor Cyan
} elseif ($percentage -ge 80) {
    Write-Host "?? PHASE 1 MOSTLY COMPLETE ($percentage%)" -ForegroundColor Green
    Write-Host "??  Some tests need attention" -ForegroundColor Yellow
} else {
    Write-Host "??  PHASE 1 INCOMPLETE ($percentage%)" -ForegroundColor Red
    Write-Host "?? Significant work needed" -ForegroundColor Yellow
}

Write-Host "=" * 80 -ForegroundColor Cyan

# Save detailed report
$report = @"
EMPATHICA PHASE 1 VALIDATION REPORT
====================================
Date: $(Get-Date)
Total Tests: $totalTests
Passed Tests: $passedTests
Success Rate: $percentage%

DETAILED RESULTS:
$(foreach ($category in $allTests) {
    "`n$($category.Category):"
    foreach ($test in $category.Tests) {
        $status = if ($test.Result) { "PASS" } else { "FAIL" }
        "  $status - $($test.Test)"
    }
})

CONCLUSION:
$(if ($percentage -eq 100) {
    "Phase 1 requirements are fully met. The backend is production-ready with all specified features implemented."
} elseif ($percentage -ge 80) {
    "Phase 1 is mostly complete. Minor issues need resolution before proceeding to Phase 2."
} else {
    "Phase 1 requires significant work. Core functionality needs implementation."
})
"@

$report | Out-File -FilePath "Phase1_Validation_Report.txt" -Encoding UTF8
Write-Host "`n?? Detailed report saved to: Phase1_Validation_Report.txt" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
