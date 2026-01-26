# ============================
# build-win.ps1
# Tauri Windows build script
# Build and rename output files with -win suffix
# ============================

Write-Host "Starting SSH Terminal build..." -ForegroundColor Green

# Run Tauri build
pnpm tauri build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Build succeeded, renaming output files..." -ForegroundColor Green

# Base bundle path
$bundlePath = "src-tauri\target\release\bundle"

# ============================
# Rename NSIS installer
# ============================
$nsisPath = Join-Path $bundlePath "nsis"
$oldNsis = Get-ChildItem -Path $nsisPath -Filter "SSH Terminal_*_x64-setup.exe" |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1

if ($oldNsis) {
    $newNsisName = $oldNsis.Name -replace "_x64-setup.exe", "_x64-setup-win.exe"
    $newNsisPath = Join-Path $nsisPath $newNsisName
    Move-Item -Path $oldNsis.FullName -Destination $newNsisPath -Force
    Write-Host "✓ NSIS: $($oldNsis.Name) -> $newNsisName" -ForegroundColor Cyan
} else {
    $newNsisPath = ""
    Write-Host "Warning: NSIS installer not found." -ForegroundColor Yellow
}

# ============================
# Rename MSI installer
# ============================
$msiPath = Join-Path $bundlePath "msi"
$oldMsi = Get-ChildItem -Path $msiPath -Filter "SSH Terminal_*_x64_en-US.msi" |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1

if ($oldMsi) {
    $newMsiName = $oldMsi.Name -replace "_x64_en-US.msi", "_x64_en-US-win.msi"
    $newMsiPath = Join-Path $msiPath $newMsiName
    Move-Item -Path $oldMsi.FullName -Destination $newMsiPath -Force
    Write-Host "MSI: $($oldMsi.Name) -> $newMsiName" -ForegroundColor Cyan
} else {
    $newMsiPath = ""
    Write-Host "Warning: MSI installer not found." -ForegroundColor Yellow
}

# ============================
# Output final results
# ============================
Write-Host "`nBuild completed! Output files:" -ForegroundColor Green

if ($newNsisPath) {
    Write-Host "  - $newNsisPath" -ForegroundColor White
}

if ($newMsiPath) {
    Write-Host "  - $newMsiPath" -ForegroundColor White
}
