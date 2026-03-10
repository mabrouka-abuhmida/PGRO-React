# Start All Backend Services Script
# This script starts all implemented backend services in separate windows

Write-Host "Starting PGR Matching Backend Services..." -ForegroundColor Green
Write-Host ""

# Get the project root directory (where the script is located)
$projectRoot = $PSScriptRoot

# Change to project root
Set-Location $projectRoot

# Find conda and python executable
$condaExe = $null
$pythonExe = $null
$condaEnvPath = $null

# Try to find conda
if (Get-Command conda -ErrorAction SilentlyContinue) {
    $condaExe = "conda"
} elseif (Test-Path "$env:USERPROFILE\anaconda3\Scripts\conda.exe") {
    $condaExe = "$env:USERPROFILE\anaconda3\Scripts\conda.exe"
} elseif (Test-Path "$env:USERPROFILE\miniconda3\Scripts\conda.exe") {
    $condaExe = "$env:USERPROFILE\miniconda3\Scripts\conda.exe"
} elseif (Test-Path "C:\ProgramData\anaconda3\Scripts\conda.exe") {
    $condaExe = "C:\ProgramData\anaconda3\Scripts\conda.exe"
}

# Try to find Python in the pgr-matching environment
$possibleCondaPaths = @(
    "$env:USERPROFILE\.conda\envs\pgr-matching",
    "$env:USERPROFILE\anaconda3\envs\pgr-matching",
    "$env:USERPROFILE\miniconda3\envs\pgr-matching",
    "C:\ProgramData\anaconda3\envs\pgr-matching",
    "C:\ProgramData\miniconda3\envs\pgr-matching"
)

foreach ($path in $possibleCondaPaths) {
    $pythonPath = Join-Path $path "python.exe"
    if (Test-Path $pythonPath) {
        $pythonExe = $pythonPath
        $condaEnvPath = $path
        break
    }
}

# If not found, try current environment
if (-not $pythonExe) {
    if ($env:CONDA_DEFAULT_ENV -eq "pgr-matching" -and (Get-Command python -ErrorAction SilentlyContinue)) {
        $pythonExe = "python"
    } elseif (Get-Command python -ErrorAction SilentlyContinue) {
        Write-Host "Warning: pgr-matching environment not found. Using current Python." -ForegroundColor Yellow
        $pythonExe = "python"
    } else {
        Write-Host "Error: Python not found. Please ensure conda environment 'pgr-matching' is set up." -ForegroundColor Red
        exit 1
    }
}

# Display which Python will be used
if ($pythonExe -and (Test-Path $pythonExe)) {
    Write-Host "Using Python: $pythonExe" -ForegroundColor Green
} else {
    Write-Host "Using Python: $pythonExe (from PATH)" -ForegroundColor Green
}
Write-Host ""

# Function to start a service in a new window
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [int]$Port
    )
    
    Write-Host "Starting $ServiceName on port $Port..." -ForegroundColor Cyan
    
    $serviceFullPath = Join-Path $projectRoot $ServicePath
    $mainFile = Join-Path $serviceFullPath "app\main.py"
    
    if (Test-Path $mainFile) {
        # Build command to run service
        # Use the Python executable we found (either from conda env or current environment)
        if ($pythonExe -and (Test-Path $pythonExe)) {
            # Use full path to Python executable
            $command = "cd '$serviceFullPath'; Write-Host 'Starting $ServiceName on port $Port...' -ForegroundColor Green; & '$pythonExe' -m app.main"
        } elseif ($condaEnvPath) {
            # Try to use conda environment's Python
            $envPython = Join-Path $condaEnvPath "python.exe"
            if (Test-Path $envPython) {
                $command = "cd '$serviceFullPath'; Write-Host 'Starting $ServiceName on port $Port...' -ForegroundColor Green; & '$envPython' -m app.main"
            } else {
                # Fallback: try to activate conda and use python
                $condaDir = Split-Path -Parent (Split-Path -Parent $condaExe)
                $condaInitScript = Join-Path $condaDir "shell\condabin\conda-hook.ps1"
                
                if (Test-Path $condaInitScript) {
                    $command = "cd '$serviceFullPath'; & '$condaInitScript'; conda activate pgr-matching; Write-Host 'Starting $ServiceName on port $Port...' -ForegroundColor Green; python -m app.main"
                } else {
                    $command = "cd '$serviceFullPath'; Write-Host 'Starting $ServiceName on port $Port...' -ForegroundColor Green; python -m app.main"
                }
            }
        } else {
            # Last resort: use python from PATH
            $command = "cd '$serviceFullPath'; Write-Host 'Starting $ServiceName on port $Port...' -ForegroundColor Green; python -m app.main"
        }
        
        Start-Process powershell -ArgumentList @(
            "-NoExit",
            "-Command",
            $command
        )
        Start-Sleep -Seconds 2
    } else {
        Write-Host "Warning: $ServiceName not found at $mainFile" -ForegroundColor Yellow
    }
}

# Start services
Write-Host "Starting services in separate windows..." -ForegroundColor Green
Write-Host ""

# 1. Staff Service (Port 8001)
Start-Service -ServiceName "Staff Service" -ServicePath "backend\services\staff-service" -Port 8001

# 2. Applicant Service (Port 8002)
Start-Service -ServiceName "Applicant Service" -ServicePath "backend\services\applicant-service" -Port 8002

# 3. Matching Service (Port 8003)
Start-Service -ServiceName "Matching Service" -ServicePath "backend\services\matching-service" -Port 8003

# 4. File Service (Port 8004)
Start-Service -ServiceName "File Service" -ServicePath "backend\services\file-service" -Port 8004

# 5. Email Service (Port 8006)
Start-Service -ServiceName "Email Service" -ServicePath "backend\services\email-service" -Port 8006

# 6. API Gateway (Port 8000) - Start last so other services are ready
Start-Sleep -Seconds 5
Start-Service -ServiceName "API Gateway" -ServicePath "backend\services\api-gateway" -Port 8000

Write-Host ""
Write-Host "All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "  - API Gateway:      http://localhost:8000" -ForegroundColor White
Write-Host "  - API Docs:         http://localhost:8000/api/docs" -ForegroundColor White
Write-Host "  - Staff Service:    http://localhost:8001" -ForegroundColor White
Write-Host "  - Applicant Service: http://localhost:8002" -ForegroundColor White
Write-Host "  - Matching Service:  http://localhost:8003" -ForegroundColor White
Write-Host "  - File Service:     http://localhost:8004" -ForegroundColor White
Write-Host "  - Email Service:    http://localhost:8006" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C in each service window to stop that service." -ForegroundColor Yellow
Write-Host "Or close the windows to stop all services." -ForegroundColor Yellow
