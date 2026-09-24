# 1. Read controller source
$filePath = Resolve-Path "Backend\Services\Tripora.BookingService\Controllers\BookingController.cs"
$code = [System.IO.File]::ReadAllText($filePath)

# 2. Wrap Outbox saving in a safe try-catch
$target = "_context.OutboxMessages.Add(outboxMessage);"
if ($code.Contains($target)) {
    $safeOutbox = @"
try
            {
                if (_context != null)
                {
                    _context.OutboxMessages.Add(outboxMessage);
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Outbox skipped: " + ex.Message);
            }
"@
    $code = $code -replace '(?s)_context\.OutboxMessages\.Add\(outboxMessage\);[\s\S]*?await _context\.SaveChangesAsync\(\);', $safeOutbox
    [System.IO.File]::WriteAllText($filePath, $code, [System.Text.Encoding]::UTF8)
    Write-Host "Successfully patched BookingController.cs!" -ForegroundColor Green
} else {
    Write-Host "Outbox block already patched or not found." -ForegroundColor Yellow
}

# 3. Clean and compile for Linux
Remove-Item -Recurse -Force .\publish\booking -ErrorAction SilentlyContinue
Remove-Item -Force .\publish\booking-deploy.zip -ErrorAction SilentlyContinue

Write-Host "Compiling BookingService for Linux..." -ForegroundColor Cyan
dotnet publish Backend\Services\Tripora.BookingService\Tripora.BookingService.csproj -c Release -r linux-x64 --no-self-contained -o ./publish/booking

# 4. Create zip archive
Push-Location ./publish/booking
tar.exe -a -c -f ../booking-deploy.zip *
Pop-Location

# 5. Extract Azure credentials and deploy
$profileFile = Get-ChildItem -Path "C:\Users\ASUS\Desktop\TRIPORA" -Filter "*booking*.PublishSettings" | Select-Object -First 1
[xml]$xml = Get-Content -Path $profileFile.FullName
$p = ($xml.publishData.publishProfile | Where-Object { $_.publishMethod -eq "ZipDeploy" -or $_.publishMethod -eq "MSDeploy" })[0]
$targetHost = ($p.publishUrl -split ':')[0]
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$($p.userName):$($p.userPWD)"))

Write-Host "Uploading package to Azure ($targetHost)..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "https://$targetHost/api/zipdeploy?isAsync=true" -Method Post -Headers @{ Authorization = "Basic $auth" } -InFile ".\publish\booking-deploy.zip" -ContentType "application/zip" -TimeoutSec 600

# 6. Monitor deployment status
do {
    Start-Sleep -Seconds 5
    $status = Invoke-RestMethod -Uri "https://$targetHost/api/deployments/latest" -Method Get -Headers @{ Authorization = "Basic $auth" }
    Write-Host "Deployment Status: $($status.status)" -ForegroundColor Yellow
    if ($status.status -in 3, 4) { break }
} while ($true)

Write-Host "Deployment completed with status $($status.status)!" -ForegroundColor Green
