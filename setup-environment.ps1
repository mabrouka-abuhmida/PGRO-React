# Setup Environment Script
# Checks if pgr-matching environment exists, if not creates it with CUDA support if available, otherwise CPU-only

Write-Host "PGR Matching System - Environment Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Get the project root directory
$projectRoot = $PSScriptRoot
Set-Location $projectRoot

# Find conda
$condaExe = $null
if (Get-Command conda -ErrorAction SilentlyContinue) {
    $condaExe = "conda"
} elseif (Test-Path "$env:USERPROFILE\anaconda3\Scripts\conda.exe") {
    $condaExe = "$env:USERPROFILE\anaconda3\Scripts\conda.exe"
} elseif (Test-Path "$env:USERPROFILE\miniconda3\Scripts\conda.exe") {
    $condaExe = "$env:USERPROFILE\miniconda3\Scripts\conda.exe"
} elseif (Test-Path "C:\ProgramData\anaconda3\Scripts\conda.exe") {
    $condaExe = "C:\ProgramData\anaconda3\Scripts\conda.exe"
}

if (-not $condaExe) {
    Write-Host "Error: Conda not found. Please install Anaconda or Miniconda." -ForegroundColor Red
    exit 1
}

Write-Host "Found Conda: $condaExe" -ForegroundColor Green
Write-Host ""

# Check if environment exists
$envName = "pgr-matching"
$envExists = $false
$possibleCondaPaths = @(
    "$env:USERPROFILE\.conda\envs\$envName",
    "$env:USERPROFILE\anaconda3\envs\$envName",
    "$env:USERPROFILE\miniconda3\envs\$envName",
    "C:\ProgramData\anaconda3\envs\$envName",
    "C:\ProgramData\miniconda3\envs\$envName"
)

foreach ($path in $possibleCondaPaths) {
    if (Test-Path $path) {
        $envExists = $true
        Write-Host "Environment '$envName' already exists at: $path" -ForegroundColor Green
        break
    }
}

# Also check using conda list
if (-not $envExists) {
    try {
        $envList = & $condaExe env list 2>&1
        if ($envList -match "$envName\s") {
            $envExists = $true
            Write-Host "Environment '$envName' found in conda environment list" -ForegroundColor Green
        }
    } catch {
        # Ignore errors
    }
}

if ($envExists) {
    Write-Host ""
    Write-Host "Environment already exists. No setup needed." -ForegroundColor Green
    Write-Host "To recreate the environment, delete it first with: conda env remove -n $envName" -ForegroundColor Yellow
    exit 0
}

Write-Host "Environment '$envName' not found. Creating new environment..." -ForegroundColor Yellow
Write-Host ""

# Check for CUDA availability
$cudaAvailable = $false
$cudaVersion = $null

Write-Host "Checking for CUDA availability..." -ForegroundColor Cyan

# Method 1: Check nvidia-smi
try {
    $nvidiaSmi = & nvidia-smi --query-gpu=driver_version --format=csv,noheader 2>&1
    if ($LASTEXITCODE -eq 0 -and $nvidiaSmi -notmatch "error|not found") {
        $cudaAvailable = $true
        Write-Host "[OK] NVIDIA GPU detected via nvidia-smi" -ForegroundColor Green
        
        # Try to get CUDA version
        try {
            $cudaInfo = & nvidia-smi --query-gpu=cuda_version --format=csv,noheader 2>&1
            if ($cudaInfo -notmatch "error|not found" -and $cudaInfo) {
                $cudaVersion = $cudaInfo.Trim()
                Write-Host "  CUDA Version: $cudaVersion" -ForegroundColor Green
            }
        } catch {
            # Ignore
        }
    }
} catch {
    # nvidia-smi not available
}

# Method 2: Check CUDA environment variables
if (-not $cudaAvailable) {
    if ($env:CUDA_PATH -or $env:CUDA_HOME) {
        $cudaAvailable = $true
        Write-Host "[OK] CUDA environment variables detected" -ForegroundColor Green
        if ($env:CUDA_PATH) {
            Write-Host "  CUDA_PATH: $env:CUDA_PATH" -ForegroundColor Green
        }
    }
}

# Method 3: Check for CUDA installation in common locations
if (-not $cudaAvailable) {
    $cudaPaths = @(
        "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA",
        "${env:ProgramFiles(x86)}\NVIDIA GPU Computing Toolkit\CUDA"
    )
    
    foreach ($cudaPath in $cudaPaths) {
        if (Test-Path $cudaPath) {
            $cudaDirs = Get-ChildItem -Path $cudaPath -Directory -ErrorAction SilentlyContinue
            if ($cudaDirs) {
                $cudaAvailable = $true
                $latestCuda = ($cudaDirs | Sort-Object Name -Descending | Select-Object -First 1).Name
                Write-Host "[OK] CUDA installation found at: $cudaPath\$latestCuda" -ForegroundColor Green
                break
            }
        }
    }
}

if ($cudaAvailable) {
    Write-Host ""
    Write-Host "CUDA is available. Creating environment with GPU support..." -ForegroundColor Green
    Write-Host ""
    
    # Check if environment.yml exists
    $envYmlPath = Join-Path $projectRoot "environment.yml"
    if (-not (Test-Path $envYmlPath)) {
        Write-Host "Error: environment.yml not found at $envYmlPath" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Creating conda environment from environment.yml (with CUDA support)..." -ForegroundColor Cyan
    & $condaExe env create -f $envYmlPath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to create conda environment from environment.yml" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "[OK] Environment created successfully with CUDA support!" -ForegroundColor Green
    
} else {
    Write-Host ""
    Write-Host "CUDA not available. Creating CPU-only environment..." -ForegroundColor Yellow
    Write-Host ""
    
    # Check if Python is available
    $pythonExe = $null
    if (Get-Command python -ErrorAction SilentlyContinue) {
        $pythonExe = "python"
    } elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
        $pythonExe = "python3"
    }
    
    if (-not $pythonExe) {
        Write-Host "Error: Python not found. Please install Python 3.11 or later." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Found Python: $pythonExe" -ForegroundColor Green
    
    # Create environment with Python only (no CUDA packages)
    Write-Host "Creating conda environment with Python 3.11 (CPU-only)..." -ForegroundColor Cyan
    & $condaExe create -n $envName python=3.11 pip -y
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to create conda environment" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "Installing Python packages from requirements.txt..." -ForegroundColor Cyan
    
    # Activate environment and install pip packages
    $condaInitScript = $null
    if ($condaExe -ne "conda") {
        $condaDir = Split-Path (Split-Path $condaExe)
        $condaInitScript = Join-Path $condaDir "shell\condabin\conda-hook.ps1"
    }
    
    # Install packages using conda run to avoid activation issues
    $requirementsPath = Join-Path $projectRoot "requirements.txt"
    if (Test-Path $requirementsPath) {
        Write-Host "Installing packages from requirements.txt..." -ForegroundColor Cyan
        & $condaExe run -n $envName pip install -r $requirementsPath
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Warning: Some packages may have failed to install. Check the output above." -ForegroundColor Yellow
        }
    } else {
        Write-Host "Warning: requirements.txt not found. Installing core packages manually..." -ForegroundColor Yellow
        
        # Install essential packages
        $corePackages = @(
            "fastapi==0.104.1",
            "uvicorn[standard]==0.24.0",
            "pydantic==2.5.0",
            "pydantic-settings==2.1.0",
            "sqlalchemy==2.0.23",
            "psycopg2-binary==2.9.9",
            "pgvector==0.2.3",
            "openai==1.3.5",
            "pymupdf>=1.23.0",
            "easyocr>=1.7.0",
            "pillow>=10.1.0",
            "sendgrid>=6.10.0",
            "redis==5.0.1",
            "httpx==0.25.1"
        )
        
        & $condaExe run -n $envName pip install $corePackages
    }
    
    # Install PyTorch CPU version
    Write-Host ""
    Write-Host "Installing PyTorch (CPU version)..." -ForegroundColor Cyan
    & $condaExe run -n $envName pip install torch==2.1.0 torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
    
    Write-Host ""
    Write-Host "[OK] Environment created successfully (CPU-only)!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To activate the environment, run:" -ForegroundColor Cyan
Write-Host "  conda activate $envName" -ForegroundColor White
Write-Host ""
Write-Host "Or use the start scripts:" -ForegroundColor Cyan
Write-Host "  .\start-backend-services.ps1" -ForegroundColor White
Write-Host "  .\start-frontend.ps1" -ForegroundColor White
Write-Host ""

