# server.ps1
# Native PowerShell HTTP static file server with API persistence for Windows.

$port = 8080
$listener = $null

# Find a free port starting from 8080
while ($port -lt 8100) {
    try {
        $listener = New-Object System.Net.HttpListener
        $listener.Prefixes.Add("http://localhost:$port/")
        $listener.Start()
        break
    } catch {
        $listener = $null
        $port++
    }
}

if ($null -eq $listener) {
    Write-Error "Could not start server. No available ports between 8080 and 8100."
    exit 1
}

Write-Host "Server successfully started on http://localhost:$port"

# Locate Brave Browser path with Chrome and Edge fallbacks
function Get-BrowserPath {
    $bravePaths = @(
        "$env:LOCALAPPDATA\BraveSoftware\Brave-Browser\Application\brave.exe",
        "$env:ProgramFiles\BraveSoftware\Brave-Browser\Application\brave.exe",
        "${env:ProgramFiles(x86)}\BraveSoftware\Brave-Browser\Application\brave.exe"
    )
    foreach ($p in $bravePaths) {
        if (Test-Path $p) { return $p }
    }
    
    $chromePaths = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    )
    foreach ($p in $chromePaths) {
        if (Test-Path $p) { return $p }
    }
    
    return "msedge"
}

$browser = Get-BrowserPath
Start-Process $browser -ArgumentList "http://localhost:$port"

$currentDir = (Get-Item -Path ".").FullName

# Generate Desktop Shortcut with Custom Icon
try {
    $WshShell = New-Object -ComObject WScript.Shell
    $desktopPath = [System.IO.Path]::Combine([System.Environment]::GetFolderPath("Desktop"), "Apex Planner.lnk")
    $startMenuPath = [System.IO.Path]::Combine([System.Environment]::GetFolderPath("StartMenu"), "Programs\Apex Planner.lnk")
    
    # Always generate/update the pinnable shortcuts in both locations
    foreach ($path in @($desktopPath, $startMenuPath)) {
        if (Test-Path $path) {
            Remove-Item $path -Force
        }
        $shortcut = $WshShell.CreateShortcut($path)
        $shortcut.TargetPath = "C:\Windows\explorer.exe"
        $shortcut.Arguments = "`"$(Join-Path $currentDir 'run.bat')`""
        $shortcut.WorkingDirectory = $currentDir
        $shortcut.IconLocation = Join-Path $currentDir "favicon.ico"
        $shortcut.Save()
    }
    Write-Host "Created Desktop and Start Menu Shortcuts successfully."
} catch {
    Write-Host "Note: Shortcut generation skipped."
}

# Background processing loop with Heartbeat Timeout Auto-Shutdown
# Allow a 60-second grace period for the browser to launch and establish the first connection
$lastHeartbeat = [DateTime]::Now.AddSeconds(60)

try {
    $contextTask = $null

    while ($listener.IsListening) {
        # Check if 10 seconds passed since last heartbeat
        if (([DateTime]::Now - $lastHeartbeat).TotalSeconds -gt 10) {
            Write-Host "No heartbeat detected for 10 seconds. Shutting down server."
            break
        }
        
        # Start a new accept task if none is active
        if ($null -eq $contextTask) {
            $contextTask = $listener.GetContextAsync()
        }
        
        # Wait up to 1000ms for a request to arrive
        if (-not $contextTask.Wait(1000)) {
            # Timed out, verify heartbeat in next iteration
            continue
        }
        
        # Request received! Resolve context and clear task
        $context = $contextTask.Result
        $contextTask = $null
        
        $request = $context.Request
        $response = $context.Response
        
        # Allow CORS
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
        
        $path = $request.Url.LocalPath
        $method = $request.HttpMethod
        
        if ($method -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.OutputStream.Close()
            continue
        }
        
        # Heartbeat endpoint
        if ($path -eq "/api/heartbeat") {
            $lastHeartbeat = [DateTime]::Now
            $response.StatusCode = 200
            $response.OutputStream.Close()
            continue
        }
        
        if ($path -eq "/") {
            $path = "/index.html"
        }
        
        # 1. API: Save State
        if ($method -eq "POST" -and $path -eq "/api/save") {
            try {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $jsonPayload = $reader.ReadToEnd()
                $reader.Close()
                
                $dataPath = Join-Path $currentDir "data.json"
                # Force UTF8 write
                [System.IO.File]::WriteAllText($dataPath, $jsonPayload, [System.Text.Encoding]::UTF8)
                
                $resBytes = [System.Text.Encoding]::UTF8.GetBytes("SUCCESS")
                $response.StatusCode = 200
                $response.ContentType = "text/plain"
                $response.ContentLength64 = $resBytes.Length
                $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
            } catch {
                $response.StatusCode = 500
            } finally {
                $response.OutputStream.Close()
            }
            continue
        }
        
        # 2. API: Load State
        if ($method -eq "GET" -and $path -eq "/api/load") {
            try {
                $dataPath = Join-Path $currentDir "data.json"
                if (Test-Path $dataPath) {
                    $jsonPayload = [System.IO.File]::ReadAllText($dataPath, [System.Text.Encoding]::UTF8)
                    $resBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonPayload)
                    $response.StatusCode = 200
                    $response.ContentType = "application/json; charset=utf-8"
                } else {
                    $resBytes = [System.Text.Encoding]::UTF8.GetBytes("{}")
                    $response.StatusCode = 200
                    $response.ContentType = "application/json; charset=utf-8"
                }
                $response.ContentLength64 = $resBytes.Length
                $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
            } catch {
                $response.StatusCode = 500
            } finally {
                $response.OutputStream.Close()
            }
            continue
        }
        
        # 3. Static Files Serving
        # Strip leading slash and decode URL
        $cleanPath = [System.Uri]::UnescapeDataString($path.Substring(1))
        $filePath = Join-Path $currentDir $cleanPath
        
        # Security check: Ensure file is inside the workspace directory
        if (-not $filePath.StartsWith($currentDir) -or -not (Test-Path $filePath -PathType Leaf)) {
            $response.StatusCode = 404
            $response.OutputStream.Close()
            continue
        }
        
        try {
            $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            
            $mime = "application/octet-stream"
            switch ($ext) {
                ".html" { $mime = "text/html; charset=utf-8" }
                ".css"  { $mime = "text/css; charset=utf-8" }
                ".js"   { $mime = "text/javascript; charset=utf-8" }
                ".ico"  { $mime = "image/x-icon" }
                ".png"  { $mime = "image/png" }
                ".svg"  { $mime = "image/svg+xml; charset=utf-8" }
                ".json" { $mime = "application/json; charset=utf-8" }
                ".webmanifest" { $mime = "application/manifest+json; charset=utf-8" }
            }
            
            $response.StatusCode = 200
            $response.ContentType = $mime
            $response.ContentLength64 = $fileBytes.Length
            $response.OutputStream.Write($fileBytes, 0, $fileBytes.Length)
        } catch {
            $response.StatusCode = 500
        } finally {
            $response.OutputStream.Close()
        }
    }
} finally {
    if ($null -ne $listener) {
        $listener.Close()
    }
}
