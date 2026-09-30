param(
    [string]$BaseUrl = 'http://localhost:5169',
    [string]$Email = $env:AuthSeed__Email,
    [string]$Password = $env:AuthSeed__Password
)
$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($Email) -or [string]::IsNullOrWhiteSpace($Password)) {
    throw 'Provide -Email and -Password, or set AuthSeed__Email and AuthSeed__Password.'
}
Add-Type -AssemblyName System.Net.Http
$client = [System.Net.Http.HttpClient]::new()
$ids = [System.Collections.Generic.List[string]]::new()
$script:checks = 0
$script:token = $null

function Send-Request([string]$Method, [string]$Path, $Body, [int]$Expected) {
    $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::new($Method), "$BaseUrl$Path")
    if ($script:token) {
        $request.Headers.Authorization =
            [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $script:token)
    }
    if ($null -ne $Body) {
        $request.Content = [System.Net.Http.StringContent]::new(
            ($Body | ConvertTo-Json -Depth 5), [System.Text.Encoding]::UTF8, 'application/json')
    }
    $response = $client.SendAsync($request).GetAwaiter().GetResult()
    try {
        $text = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        if ([int]$response.StatusCode -ne $Expected) {
            throw "$Method $Path expected $Expected, got $([int]$response.StatusCode): $text"
        }
        $script:checks++
        if ($text) { return ($text | ConvertFrom-Json) }
    } finally {
        $response.Dispose()
        $request.Dispose()
    }
}

function Assert-True([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
    $script:checks++
}

function New-ClaimNumber {
    "SMOKE-$([Guid]::NewGuid().ToString('N'))"
}

try {
    $null = Send-Request GET '/api/claims' $null 401
    $null = Send-Request POST '/api/auth/login' @{ email = $Email; password = "$Password-invalid" } 401
    $session = Send-Request POST '/api/auth/login' @{ email = $Email; password = $Password } 200
    $script:token = $session.accessToken
    $me = Send-Request GET '/api/auth/me' $null 200
    Assert-True ($me.email -eq $session.user.email) 'Authenticated user mismatch'

    $types = @(Send-Request GET '/api/claim-types' $null 200)
    Assert-True ($types.Count -ge 2) 'At least two active claim types are required'

    $body = @{
        claimNumber = New-ClaimNumber
        policyNumber = 'POL-TEST'
        insuredName = ' Test Insured '
        insuredDocument = '529.982.247-25'
        claimTypeId = $types[0].id
        occurrenceDate = [DateTime]::UtcNow.AddDays(-1).ToString('yyyy-MM-dd')
        estimatedAmount = 100.25
        description = 'Smoke test'
    }
    $created = Send-Request POST '/api/claims' $body 201
    $ids.Add($created.id)
    Assert-True ($created.status -eq 'Open' -and $null -eq $created.updatedAt) 'Invalid initial status/audit'
    Assert-True ($created.insuredName -eq 'Test Insured') 'Text was not trimmed'
    Assert-True ($created.insuredDocument -eq '52998224725') 'Document was not normalized'
    Assert-True ($created.claimType -eq $types[0].name) 'Claim type name missing from create response'
    Assert-True ([string]$created.createdAt -match 'Z$') 'CreatedAt is not UTC'
    $read = Send-Request GET "/api/claims/$($created.id)" $null 200
    Assert-True ($read.claimNumber -eq $body.claimNumber) 'Claim not persisted'
    $list = Send-Request GET "/api/claims?searchTerm=$($body.claimNumber)" $null 200
    Assert-True ($list.totalCount -eq 1 -and @($list.items.id) -contains $created.id) 'Claim missing from list'
    $null = Send-Request POST '/api/claims' $body 409

    $body.claimNumber = New-ClaimNumber
    $second = Send-Request POST '/api/claims' $body 201
    $ids.Add($second.id)
    $body.status = 'UnderAnalysis'
    $null = Send-Request PUT "/api/claims/$($created.id)" $body 409

    $body.claimNumber = $created.claimNumber
    foreach ($status in @('UnderAnalysis', 'Approved', 'Rejected', 'Closed', 'Open')) {
        $body.status = $status
        $updated = Send-Request PUT "/api/claims/$($created.id)" $body 200
        $read = Send-Request GET "/api/claims/$($created.id)" $null 200
        Assert-True ($read.status -eq $status -and $null -ne $read.updatedAt) 'Update not persisted'
        Assert-True ($read.createdAt -eq $created.createdAt) 'CreatedAt changed'
    }

    $body.claimTypeId = $types[1].id
    $updated = Send-Request PUT "/api/claims/$($created.id)" $body 200
    Assert-True ($updated.claimTypeId -eq $types[1].id -and $updated.claimType -eq $types[1].name) `
        'Claim type missing from update response'
    $read = Send-Request GET "/api/claims/$($created.id)" $null 200
    Assert-True ($read.claimTypeId -eq $types[1].id -and $read.claimType -eq $types[1].name) `
        'Claim type change not persisted'

    $dashboard = Send-Request GET '/api/claims/dashboard' $null 200
    $statusTotal = 0
    foreach ($summary in @($dashboard.claimsByStatus)) { $statusTotal += $summary.count }
    Assert-True ($dashboard.totalClaims -ge 2 -and $statusTotal -eq $dashboard.totalClaims) `
        'Dashboard totals are inconsistent'
    Assert-True (@($dashboard.claimsByType.claimType) -contains $types[1].name) 'Claim type missing from dashboard'
    Assert-True (@($dashboard.recentClaims.id) -contains $second.id) 'Recent claim missing from dashboard'

    $body.status = 'Invalid'
    $null = Send-Request PUT "/api/claims/$($created.id)" $body 400
    $body.status = 99
    $null = Send-Request PUT "/api/claims/$($created.id)" $body 400
    $body.Remove('status')
    $null = Send-Request PUT "/api/claims/$($created.id)" $body 400
    foreach ($case in @(
        @{field='insuredName'; value='   '},
        @{field='claimNumber'; value=('X' * 51)},
        @{field='insuredDocument'; value='12345678900'},
        @{field='insuredDocument'; value='11111111111'},
        @{field='claimTypeId'; value=0},
        @{field='claimTypeId'; value=2147483647},
        @{field='occurrenceDate'; value=[DateTime]::UtcNow.AddDays(1).ToString('yyyy-MM-dd')},
        @{field='occurrenceDate'; value='0001-01-01'},
        @{field='estimatedAmount'; value=-1},
        @{field='estimatedAmount'; value=1.234}
    )) {
        $invalid = $body.Clone()
        $invalid.claimNumber = New-ClaimNumber
        $invalid[$case.field] = $case.value
        $null = Send-Request POST '/api/claims' $invalid 400
    }
    $missing = [Guid]::NewGuid()
    $null = Send-Request GET "/api/claims/$missing" $null 404
    $body.status = 'Open'
    $null = Send-Request PUT "/api/claims/$missing" $body 404
    $null = Send-Request DELETE "/api/claims/$missing" $null 404
    foreach ($id in $ids.ToArray()) {
        $null = Send-Request DELETE "/api/claims/$id" $null 204
        $null = Send-Request GET "/api/claims/$id" $null 404
        $null = $ids.Remove($id)
    }

    $body.Remove('status')
    $reused = Send-Request POST '/api/claims' $body 201
    $ids.Add($reused.id)
    Assert-True ($reused.claimNumber -eq $created.claimNumber) 'Deleted claim number was not reused'
    $null = Send-Request DELETE "/api/claims/$($reused.id)" $null 204
    $null = $ids.Remove($reused.id)
    Write-Output "PASS: $script:checks checks."
} finally {
    foreach ($id in $ids) {
        try { $null = Send-Request DELETE "/api/claims/$id" $null 204 }
        catch { Write-Warning "Cleanup failed for claim $id" }
    }
    $client.Dispose()
}
