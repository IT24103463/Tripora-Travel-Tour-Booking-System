<# .\start-backend.ps1 -Mode NewWindow 
.SYNOPSIS
    Starts Docker (Kafka, Kafka-UI), all Tripora backend microservices, and API Gateway.
    Press Ctrl+C to stop all services.

.DESCRIPTION
    This PowerShell script ensures Docker Desktop and Kafka are up, then builds and launches
    the Tripora backend services:
    - Kafka Broker         (localhost:9092)
    - Kafka UI             (http://localhost:8080)
    - ApiGateway           (http://localhost:5120)
    - UserService          (http://localhost:5001)
    - DestinationService   (http://localhost:5003)
    - BookingService       (http://localhost:5004)
    - PaymentService       (http://localhost:5005)

.PARAMETER Services
    Specific services to start (e.g. -Services User, Tour, ApiGateway). Default is 'All'.

.PARAMETER Mode
    Execution mode:
    - Inline     : Runs services in this terminal and stops ALL services when Ctrl+C is pressed (default)
    - NewWindow  : Opens each service in a separate PowerShell console window
    - Background : Runs services detached in background
    - WT         : Opens services as tabs inside Windows Terminal

.PARAMETER Build
    Builds the solution before starting services.

.PARAMETER Stop
    Stops any running dotnet processes associated with the backend services.

.PARAMETER StopContainers
    When used with -Stop, also stops the Kafka and Docker Compose containers.

.PARAMETER SkipDocker
    Skips checking and launching Docker/Kafka.
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string[]]$Services = @("All"),

    [ValidateSet("Inline", "NewWindow", "Background", "WT")]
    [string]$Mode = "Inline",

    [switch]$Build,
    [switch]$Stop,
    [switch]$StopContainers,
    [switch]$SkipDocker,
    [switch]$Help
)

if ($Help) {
    Get-Help $MyInvocation.MyCommand.Path -Full
    exit 0
}

# Persisted database password
if ([string]::IsNullOrWhiteSpace($env:TRIPORA_DB_PASSWORD)) {
    $savedDbPassword = [Environment]::GetEnvironmentVariable("TRIPORA_DB_PASSWORD", "User")
    if (-not [string]::IsNullOrWhiteSpace($savedDbPassword)) {
        $env:TRIPORA_DB_PASSWORD = $savedDbPassword
    }
}

# Determine directories
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ((Split-Path -Leaf $ScriptDir) -ieq "Backend") {
    $RootDir = Split-Path -Parent $ScriptDir
    $BackendDir = $ScriptDir
} else {
    $RootDir = $ScriptDir
    $BackendDir = Join-Path $RootDir "Backend"
}

# Locate docker-compose.yml
$ComposeFile = Join-Path $RootDir "docker-compose.yml"
if (-not (Test-Path $ComposeFile)) {
    $ComposeFile = Join-Path $BackendDir "docker-compose.yml"
}

# Microservices list
$AllServices = @(
    [PSCustomObject]@{ Id = "ApiGateway";     Name = "ApiGateway";          Path = "Backend\ApiGateway";                   Port = 5120; Route = "/api/*" },
    [PSCustomObject]@{ Id = "User";           Name = "UserService";         Path = "Backend\Services\Tripora.UserService"; Port = 5001; Route = "/api/users/*" },
    [PSCustomObject]@{ Id = "Destination";    Name = "DestinationService";  Path = "Backend\Services\Tripora.DestinationService"; Port = 5003; Route = "/api/tours/*" },
    [PSCustomObject]@{ Id = "Booking";        Name = "BookingService";      Path = "Backend\Services\Tripora.BookingService";Port = 5004; Route = "/api/bookings/*" },
    [PSCustomObject]@{ Id = "Payment";        Name = "PaymentService";      Path = "Backend\Services\Tripora.PaymentService";Port = 5005; Route = "/api/payments/*" }
)

# Test open port helper
function Test-PortOpen ([string]$server, [int]$port) {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $asyncResult = $tcpClient.BeginConnect($server, $port, $null, $null)
        $wait = $asyncResult.AsyncWaitHandle.WaitOne(1000, $false)
        if ($wait -and $tcpClient.Connected) {
            $tcpClient.EndConnect($asyncResult)
            $tcpClient.Close()
            return $true
        }
        $tcpClient.Close()
        return $false
    } catch {
        return $false
    }
}

# Ensure Docker and Kafka infrastructure is active
function Ensure-DockerAndKafka {
    if ($SkipDocker) {
        Write-Host "`n[Docker] Skipped due to -SkipDocker switch." -ForegroundColor Gray
        return
    }

    Write-Host "`n=======================================================" -ForegroundColor Cyan
    Write-Host " Checking Docker & Kafka Infrastructure..." -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan

    if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
        Write-Host "Warning: Docker CLI is not installed or not in PATH. Skipping Kafka setup." -ForegroundColor Yellow
        return
    }

    $dockerRunning = $false
    try {
        $null = docker info 2>&1
        if ($LASTEXITCODE -eq 0) { $dockerRunning = $true }
    } catch {}

    if (-not $dockerRunning) {
        Write-Host "Docker daemon is not running. Attempting to start Docker Desktop..." -ForegroundColor Yellow
        $dockerExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        if (Test-Path $dockerExe) {
            Start-Process $dockerExe
        } else {
            $cmd = Get-Command "Docker Desktop.exe" -ErrorAction SilentlyContinue
            if ($cmd) {
                Start-Process $cmd.Source
            } else {
                Write-Host "Could not locate Docker Desktop.exe. Please start Docker manually." -ForegroundColor Red
                return
            }
        }

        Write-Host "Waiting for Docker daemon to become responsive..." -ForegroundColor Yellow -NoNewline
        $maxAttempts = 30
        $attempt = 0
        while (-not $dockerRunning -and $attempt -lt $maxAttempts) {
            Start-Sleep -Seconds 3
            $attempt++
            Write-Host -NoNewline "."
            try {
                $null = docker info 2>&1
                if ($LASTEXITCODE -eq 0) { $dockerRunning = $true }
            } catch {}
        }
        Write-Host ""

        if (-not $dockerRunning) {
            Write-Host "Docker daemon took too long to start. Microservices will run, but Kafka may be unavailable." -ForegroundColor Red
            return
        }
    }

    Write-Host "Docker daemon is active." -ForegroundColor Green

    if (Test-Path $ComposeFile) {
        Write-Host "Starting Kafka and Kafka-UI containers..." -ForegroundColor Cyan
        docker compose -f $ComposeFile up -d
    } else {
        $kafkaContainer = docker ps -a --filter "name=tripora-kafka" --format "{{.Names}}"
        if ($kafkaContainer) {
            docker start tripora-kafka tripora-kafka-ui 2>$null
        } else {
            Write-Host "Warning: docker-compose.yml not found at $ComposeFile. Skipping container startup." -ForegroundColor Yellow
        }
    }

    Write-Host "Verifying Kafka broker availability on port 9092..." -ForegroundColor Cyan -NoNewline
    $kafkaReady = $false
    for ($i = 0; $i -lt 25; $i++) {
        if (Test-PortOpen "localhost" 9092) {
            $kafkaReady = $true
            break
        }
        Write-Host -NoNewline "." -ForegroundColor Yellow
        Start-Sleep -Seconds 1
    }
    Write-Host ""

    if ($kafkaReady) {
        Write-Host "Kafka broker is online and ready (localhost:9092)." -ForegroundColor Green
    } else {
        Write-Host "Warning: Kafka broker did not respond on port 9092 within 25s. Services will retry automatically via Outbox." -ForegroundColor Yellow
    }
}

# Stop backend services
function Stop-BackendServices {
    Write-Host "`n=======================================================" -ForegroundColor Yellow
    Write-Host " Stopping Tripora Backend Services..." -ForegroundColor Yellow
    Write-Host "=======================================================" -ForegroundColor Yellow

    foreach ($svc in $AllServices) {
        $port = $svc.Port
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($conn in $connections) {
                $processId = $conn.OwningProcess
                if ($processId -and $processId -ne 0) {
                    try {
                        $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
                        if ($proc) {
                            Write-Host "Stopping $($svc.Name) (PID: $processId, Port:$port)..." -ForegroundColor Magenta
                            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                        }
                    } catch {}
                }
            }
        }
    }
    Write-Host "All backend services stopped." -ForegroundColor Green

    if ($StopContainers) {
        Write-Host "`nStopping Docker infrastructure..." -ForegroundColor Yellow
        if (Test-Path $ComposeFile) {
            docker compose -f $ComposeFile stop
        } else {
            docker stop tripora-kafka tripora-kafka-ui 2>$null
        }
        Write-Host "Docker containers stopped.`n" -ForegroundColor Green
    }
}

if ($Stop) {
    Stop-BackendServices
    exit 0
}

# Banner
Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "      TRIPORA BACKEND SERVICES LAUNCHER                " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# Step 0: Ensure Docker and Kafka are active
Ensure-DockerAndKafka

# Filter requested services
$TargetServices = @()
if ($Services -contains "All") {
    $TargetServices = $AllServices
} else {
    foreach ($req in $Services) {
        $match = $AllServices | Where-Object { $_.Id -ieq $req -or $_.Name -ieq $req -or $_.Name -ilike "*$req*" }
        if ($match) {
            $TargetServices += $match
        } else {
            Write-Host "Warning: Service '$req' not recognized." -ForegroundColor Yellow
        }
    }
}

if ($TargetServices.Count -eq 0) {
    Write-Host "No valid services selected to start." -ForegroundColor Red
    exit 1
}

# Step 1: Optional Build
if ($Build) {
    Write-Host "`n[1/2] Building Backend Solution..." -ForegroundColor Yellow
    $slnPath = Join-Path $BackendDir "Tripora.slnx"
    if (-not (Test-Path $slnPath)) {
        $slnPath = Join-Path $RootDir "Tripora.sln"
    }
    if (Test-Path $slnPath) {
        dotnet build $slnPath --configuration Debug
        if ($LASTEXITCODE -ne 0) {
            Write-Host "`n[ERROR] Build failed! Aborting startup." -ForegroundColor Red
            exit $LASTEXITCODE
        }
        Write-Host "Build Succeeded!" -ForegroundColor Green
    } else {
        Write-Host "Warning: Solution file not found. Skipping pre-build." -ForegroundColor Yellow
    }
} else {
    Write-Host "`n[1/2] Skipping build (use -Build switch to enable pre-build check)." -ForegroundColor Gray
}

# Ensure log directory exists
$LogDir = Join-Path $BackendDir "logs"
if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

Write-Host "`nChecking for orphaned processes on required ports..." -ForegroundColor Cyan
foreach ($svc in $TargetServices) {
    $port = $svc.Port
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $processId = $conn.OwningProcess
            if ($processId -and $processId -ne 0) {
                try {
                    $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($proc) {
                        Write-Host "Warning: Port $port is in use. Killing orphaned $($proc.ProcessName) (PID: $processId)..." -ForegroundColor Yellow
                        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                        Start-Sleep -Milliseconds 500
                    }
                } catch {}
            }
        }
    }
}

# Step 2: Launch Services
Write-Host "`n[2/2] Launching $($TargetServices.Count) Service(s) in '$Mode' mode..." -ForegroundColor Yellow

$launchedProcesses = @()
$launchedSummary = @()

foreach ($svc in $TargetServices) {
    $svcPath = Join-Path $RootDir $svc.Path
    if (!(Test-Path $svcPath)) {
        Write-Host "Error: Directory missing for $($svc.Name) at $svcPath" -ForegroundColor Red
        continue
    }

    $url = "http://localhost:$($svc.Port)"
    $launchedSummary += [PSCustomObject]@{
        Name         = $svc.Name
        Port         = $svc.Port
        Url          = $url
        GatewayRoute = "http://localhost:5120$($svc.Route.TrimEnd('*'))"
    }

    Write-Host "Starting [$($svc.Name)] on $url ..." -ForegroundColor Green

    $logFile = Join-Path $LogDir "$($svc.Name).log"
    $csprojPath = Join-Path $svcPath "$($svc.Name).csproj"
    if (!(Test-Path $csprojPath)) {
        $csprojFiles = Get-ChildItem -Path $svcPath -Filter "*.csproj"
        if ($csprojFiles.Count -gt 0) {
            $csprojPath = $csprojFiles[0].FullName
        }
    }

    if ($Mode -eq "Inline" -or $Mode -eq "Background") {
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "dotnet"
        $psi.Arguments = "run --project `"$csprojPath`" --urls `"$url`""
        $psi.WorkingDirectory = $svcPath
        $psi.UseShellExecute = $false
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.CreateNoWindow = $true

        $proc = New-Object System.Diagnostics.Process
        $proc.StartInfo = $psi

        $logStream = [System.IO.StreamWriter]::new($logFile, $false)
        $proc.add_OutputDataReceived({
            param($sender,$e)
            if ($e.Data) {$logStream.WriteLine($e.Data);$logStream.Flush() }
        })
        $proc.add_ErrorDataReceived({
            param($sender,$e)
            if ($e.Data) {$logStream.WriteLine("[ERR] " + $e.Data);$logStream.Flush() }
        })

        $null = $proc.Start()
        $proc.BeginOutputReadLine()
        $proc.BeginErrorReadLine()

        $launchedProcesses += [PSCustomObject]@{ Process = $proc; StreamWriter = $logStream; Name = $svc.Name; Port = $svc.Port }
    }
    elseif ($Mode -eq "NewWindow") {
        $cmd = "& { `$host.ui.RawUI.WindowTitle = 'Tripora - $($svc.Name) ($($svc.Port))'; `$env:ASPNETCORE_URLS='$url'; Set-Location '$svcPath'; Write-Host '==================================================' -ForegroundColor Cyan; Write-Host '  Tripora$($svc.Name) Running on$url' -ForegroundColor Green; Write-Host '==================================================' -ForegroundColor Cyan; dotnet run }"
        $p = Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $cmd -WorkingDirectory $svcPath -PassThru
        $launchedProcesses += [PSCustomObject]@{ Process = $p; StreamWriter = $null; Name = $svc.Name; Port = $svc.Port }
    }
    elseif ($Mode -eq "WT") {
        if (Get-Command "wt.exe" -ErrorAction SilentlyContinue) {
            wt -w 0 new-tab -d "$svcPath" --title "$($svc.Name)" powershell -NoExit -Command "`$env:ASPNETCORE_URLS='$url'; dotnet run"
        } else {
            Write-Host "wt.exe (Windows Terminal) not found. Falling back to NewWindow." -ForegroundColor Yellow
            $cmd = "& { `$host.ui.RawUI.WindowTitle = 'Tripora - $($svc.Name) ($($svc.Port))'; `$env:ASPNETCORE_URLS='$url'; Set-Location '$svcPath'; dotnet run }"
            $p = Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $cmd -WorkingDirectory $svcPath -PassThru
            $launchedProcesses += [PSCustomObject]@{ Process = $p; StreamWriter = $null; Name = $svc.Name; Port = $svc.Port }
        }
    }

    Start-Sleep -Milliseconds 300
}

# Print Summary Table
Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "          BACKEND SERVICES SUMMARY                      " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

$launchedSummary | Format-Table -AutoSize Name, Port, Url, GatewayRoute

if ($Mode -eq "Inline") {
    Write-Host "`n[RUNNING] All backend services are running in the background." -ForegroundColor Green
    Write-Host "[LOGS] Output logs are being written to: Backend\logs\" -ForegroundColor DarkGray
    Write-Host "Press Ctrl+C to stop all services..." -ForegroundColor Yellow -NoNewline
    Write-Host ""

    try {
        while ($true) {
            Start-Sleep -Seconds 1
        }
    }
    finally {
        Write-Host "`n`n[Ctrl+C Detected] Shutting down all backend services..." -ForegroundColor Yellow
        foreach ($item in $launchedProcesses) {
            if ($item.Process -and -not $item.Process.HasExited) {
                Write-Host "Stopping $($item.Name) (PID: $($item.Process.Id))..." -ForegroundColor Magenta
                try { Stop-Process -Id $item.Process.Id -Force -ErrorAction SilentlyContinue } catch {}
            }
            if ($item.StreamWriter) {
                try { $item.StreamWriter.Close() } catch {}
            }
        }
        Stop-BackendServices
        Write-Host "Shutdown complete." -ForegroundColor Green
    }
}
else {
    Write-Host "All requested backend services have been launched." -ForegroundColor Green
    Write-Host "To stop services later, run: .\start-backend.ps1 -Stop`n" -ForegroundColor Yellow
}
