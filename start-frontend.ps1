# Start Frontend Script
# This script activates the conda environment and starts the frontend development server

Write-Host "Starting PGR Matching Frontend..." -ForegroundColor Green
Write-Host ""

# Get the project root directory (where the script is located)
$projectRoot = $PSScriptRoot

# Change to project root
Set-Location $projectRoot

# Find conda and activate environment
$condaExe = $null
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

# Try to find conda environment
$possibleCondaPaths = @(
    "$env:USERPROFILE\.conda\envs\pgr-matching",
    "$env:USERPROFILE\anaconda3\envs\pgr-matching",
    "$env:USERPROFILE\miniconda3\envs\pgr-matching",
    "C:\ProgramData\anaconda3\envs\pgr-matching",
    "C:\ProgramData\miniconda3\envs\pgr-matching"
)

foreach ($path in $possibleCondaPaths) {
    if (Test-Path $path) {
        $condaEnvPath = $path
        break
    }
}

# Check if Node.js is available
$nodeExe = $null
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeExe = "node"
} elseif (Test-Path "$env:ProgramFiles\nodejs\node.exe") {
    $nodeExe = "$env:ProgramFiles\nodejs\node.exe"
} elseif (Test-Path "${env:ProgramFiles(x86)}\nodejs\node.exe") {
    $nodeExe = "${env:ProgramFiles(x86)}\nodejs\node.exe"
}

if (-not $nodeExe) {
    Write-Host "Error: Node.js not found. Please install Node.js to run the frontend." -ForegroundColor Red
    exit 1
}

# Check if npm is available
$npmExe = $null
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmExe = "npm"
} elseif ($nodeExe) {
    # npm should be available if node is available
    $npmExe = "npm"
}

if (-not $npmExe) {
    Write-Host "Error: npm not found. Please install npm to run the frontend." -ForegroundColor Red
    exit 1
}

Write-Host "Using Node.js: $nodeExe" -ForegroundColor Green
Write-Host "Using npm: $npmExe" -ForegroundColor Green
Write-Host ""

# Navigate to frontend directory
$frontendPath = Join-Path $projectRoot "frontend"

if (-not (Test-Path $frontendPath)) {
    Write-Host "Error: Frontend directory not found at: $frontendPath" -ForegroundColor Red
    exit 1
}

Set-Location $frontendPath
Write-Host "Changed to frontend directory: $frontendPath" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists, if not, run npm install
$nodeModulesPath = Join-Path $frontendPath "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    Write-Host ""
    
    # Activate conda environment if found (for consistency, even though frontend doesn't need it)
    if ($condaExe -and $condaEnvPath) {
        Write-Host "Activating conda environment: pgr-matching" -ForegroundColor Cyan
        # Initialize conda for PowerShell
        if ($condaExe -ne "conda") {
            $condaInitScript = Join-Path (Split-Path (Split-Path $condaExe)) "shell\condabin\conda-hook.ps1"
            if (Test-Path $condaInitScript) {
                & $condaInitScript
            }
        }
        conda activate pgr-matching
    } elseif ($env:CONDA_DEFAULT_ENV -eq "pgr-matching") {
        Write-Host "Conda environment 'pgr-matching' is already active" -ForegroundColor Green
    }
    
    Write-Host "Running: npm install" -ForegroundColor Cyan
    & $npmExe install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: npm install failed. Please check the error messages above." -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "node_modules found. Skipping npm install." -ForegroundColor Green
    Write-Host ""
}

# Activate conda environment if found (for consistency)
if ($condaExe -and $condaEnvPath) {
    Write-Host "Activating conda environment: pgr-matching" -ForegroundColor Cyan
    # Initialize conda for PowerShell
    if ($condaExe -ne "conda") {
        $condaInitScript = Join-Path (Split-Path (Split-Path $condaExe)) "shell\condabin\conda-hook.ps1"
        if (Test-Path $condaInitScript) {
            & $condaInitScript
        }
    }
    conda activate pgr-matching
} elseif ($env:CONDA_DEFAULT_ENV -eq "pgr-matching") {
    Write-Host "Conda environment 'pgr-matching' is already active" -ForegroundColor Green
} else {
    Write-Host "Note: Conda environment 'pgr-matching' not found. Frontend will run without it." -ForegroundColor Yellow
}
Write-Host ""

# Start the frontend development server
Write-Host "Starting frontend development server..." -ForegroundColor Green
Write-Host "Frontend will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Run npm run dev
& $npmExe run dev

