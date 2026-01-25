# ============================================
# LUMIERE UPLOAD SCRIPT (Windows PowerShell)
# ============================================
# Transfers only necessary files to VPS

param(
    [string]$Server = "83.228.218.52",
    [string]$User = "debian",
    [string]$KeyFile = "C:\Users\MarcOliva\Downloads\id_rsa_lumiere_prod.txt",
    [string]$RemotePath = "/var/www/lumiere"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "LUMIERE UPLOAD SCRIPT" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Source directory
$SourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Files and folders to upload
$ItemsToUpload = @(
    "backend-v2",
    "frontend-v2",
    "portal-runner-v2",
    "nginx",
    "docker-compose.yml",
    ".env.production.example",
    "deploy.sh"
)

# Create temporary directory for clean copy
$TempDir = Join-Path $env:TEMP "lumiere-deploy-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

Write-Host "[1/4] Preparing files..." -ForegroundColor Yellow

foreach ($item in $ItemsToUpload) {
    $sourcePath = Join-Path $SourceDir $item
    $destPath = Join-Path $TempDir $item
    
    if (Test-Path $sourcePath) {
        if ((Get-Item $sourcePath).PSIsContainer) {
            # It's a directory - copy excluding node_modules and dist
            Write-Host "  Copying $item (excluding node_modules, dist)..."
            
            # Use robocopy for efficient copying with exclusions
            $excludeDirs = @("node_modules", "dist", ".git")
            $excludeArgs = $excludeDirs | ForEach-Object { "/XD", $_ }
            
            robocopy $sourcePath $destPath /E /NFL /NDL /NJH /NJS /NC /NS @excludeArgs | Out-Null
        } else {
            # It's a file
            Write-Host "  Copying $item..."
            Copy-Item $sourcePath $destPath -Force
        }
    } else {
        Write-Host "  WARNING: $item not found, skipping..." -ForegroundColor Red
    }
}

Write-Host "[2/4] Creating archive..." -ForegroundColor Yellow

# Create tar.gz archive
$ArchivePath = Join-Path $env:TEMP "lumiere-deploy.tar.gz"
if (Test-Path $ArchivePath) { Remove-Item $ArchivePath -Force }

# Use tar (available in Windows 10+)
Push-Location $TempDir
tar -czvf $ArchivePath *
Pop-Location

$ArchiveSize = [math]::Round((Get-Item $ArchivePath).Length / 1MB, 2)
Write-Host "  Archive created: $ArchiveSize MB" -ForegroundColor Green

Write-Host "[3/4] Uploading to server..." -ForegroundColor Yellow
Write-Host "  Target: $User@$Server`:$RemotePath"

# Upload archive
scp -i $KeyFile $ArchivePath "${User}@${Server}:/tmp/lumiere-deploy.tar.gz"

Write-Host "[4/4] Extracting on server..." -ForegroundColor Yellow

# Extract on server (commands on single line to avoid Windows line ending issues)
ssh -i $KeyFile "${User}@${Server}" "sudo mkdir -p $RemotePath && sudo chown ${User}:${User} $RemotePath && cd $RemotePath && tar -xzvf /tmp/lumiere-deploy.tar.gz && rm /tmp/lumiere-deploy.tar.gz && chmod +x deploy.sh && echo 'Files extracted successfully'"

# Cleanup
Write-Host ""
Write-Host "Cleaning up temporary files..." -ForegroundColor Gray
Remove-Item $TempDir -Recurse -Force
Remove-Item $ArchivePath -Force

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "UPLOAD COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps on the server:" -ForegroundColor Cyan
Write-Host "  ssh -i $KeyFile $User@$Server"
Write-Host "  cd $RemotePath"
Write-Host "  cp .env.production.example .env"
Write-Host "  nano .env  # Edit with your values"
Write-Host "  ./deploy.sh"
Write-Host ""
