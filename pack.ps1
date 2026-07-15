# pack.ps1
# Bundles all files into a single, fully portable hybrid batch file.

$currentDir = (Get-Item -Path ".").FullName
$outputPath = Join-Path $currentDir "ApexPlanner_Portable.bat"

# Read all local files
$html = [System.IO.File]::ReadAllText((Join-Path $currentDir "index.html"), [System.Text.Encoding]::UTF8)
$css  = [System.IO.File]::ReadAllText((Join-Path $currentDir "style.css"), [System.Text.Encoding]::UTF8)
$js   = [System.IO.File]::ReadAllText((Join-Path $currentDir "app.js"), [System.Text.Encoding]::UTF8)
$ps1  = [System.IO.File]::ReadAllText((Join-Path $currentDir "server.ps1"), [System.Text.Encoding]::UTF8)
$vbs  = [System.IO.File]::ReadAllText((Join-Path $currentDir "launch.vbs"), [System.Text.Encoding]::UTF8)
$bat  = [System.IO.File]::ReadAllText((Join-Path $currentDir "run.bat"), [System.Text.Encoding]::UTF8)

# Convert favicon to base64 binary representation
$faviconBytes = [System.IO.File]::ReadAllBytes((Join-Path $currentDir "favicon.ico"))
$faviconB64 = [System.Convert]::ToBase64String($faviconBytes)

# Base64 encode text assets to prevent escaping syntax issues
$htmlB64 = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($html))
$cssB64  = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($css))
$jsB64   = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($js))
$ps1B64  = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($ps1))
$vbsB64  = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($vbs))
$batB64  = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($bat))

$hybridContent = @"
<# :
@echo off
title Apex Planner Portable Installer
echo ===================================================
echo      APEX PLANNER - PORTABLE INSTALLER
echo ===================================================
echo.
echo Preparing to extract application files...
powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((Get-Content '%~f0') -join \"`n\")"
echo.
echo SUCCESS! Apex Planner files extracted to "%CD%\Apex Planner"
echo Starting application in Brave...
cd "Apex Planner"
start "" wscript.exe launch.vbs
exit /b
#>

# PowerShell Stub to extract files from base64
`$targetDir = Join-Path (Get-Item -Path ".").FullName "Apex Planner"
if (-not (Test-Path `$targetDir)) {
    New-Item -ItemType Directory -Path `$targetDir -Force | Out-Null
}

function Extract-File (`$name, `$b64, `$isBinary) {
    `$filePath = Join-Path `$targetDir `$name
    `$bytes = [System.Convert]::FromBase64String(`$b64)
    if (`$isBinary) {
        [System.IO.File]::WriteAllBytes(`$filePath, `$bytes)
    } else {
        `$text = [System.Text.Encoding]::UTF8.GetString(`$bytes)
        [System.IO.File]::WriteAllText(`$filePath, `$text, [System.Text.Encoding]::UTF8)
    }
}

Write-Host "Extracting index.html..."
Extract-File "index.html" "$htmlB64" `$false

Write-Host "Extracting style.css..."
Extract-File "style.css" "$cssB64" `$false

Write-Host "Extracting app.js..."
Extract-File "app.js" "$jsB64" `$false

Write-Host "Extracting server.ps1..."
Extract-File "server.ps1" "$ps1B64" `$false

Write-Host "Extracting launch.vbs..."
Extract-File "launch.vbs" "$vbsB64" `$false

Write-Host "Extracting run.bat..."
Extract-File "run.bat" "$batB64" `$false

Write-Host "Extracting favicon.ico..."
Extract-File "favicon.ico" "$faviconB64" `$true

Write-Host "Extraction completed."
"@

# Write hybrid batch file
[System.IO.File]::WriteAllText($outputPath, $hybridContent, [System.Text.Encoding]::UTF8)
Write-Host "SUCCESS: Generated portable installer at $outputPath"
