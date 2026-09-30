$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

Write-Host "=== StillAliveArcade: Offline LLM Setup ===" -ForegroundColor Cyan

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$ollamaLocal  = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
$ollamaExe    = $ollamaLocal
$found        = $false

if (Test-Path $ollamaLocal) {
    $found = $true
    Write-Host "Ollama detected at local install: $ollamaLocal" -ForegroundColor Green
} else {
    $fromPath = Get-Command ollama -ErrorAction SilentlyContinue
    if ($fromPath) {
        $ollamaExe = $fromPath.Source
        $found = $true
        Write-Host "Ollama detected on PATH: $ollamaExe" -ForegroundColor Green
    }
}

if (-not $found) {
    Write-Host "Ollama not found locally; skipping installer download." -ForegroundColor Yellow
    throw "Ollama is not installed"
}

$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","User") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","Machine")

if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Host "ollama command not found on PATH" -ForegroundColor Red
    throw "ollama not found"
}

$pidFile = "$env:USERPROFILE\.ollama\ollama.pid"
$running = $false
if (Test-Path $pidFile) {
    $pid = (Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
    if ($pid -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
        $running = $true
        Write-Host "Ollama already running (PID=$pid)" -ForegroundColor Green
    }
}

if (-not $running) {
    Write-Host "Launching Ollama serve..." -ForegroundColor Yellow
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}

Write-Host "Pulling llama3..." -ForegroundColor Yellow
ollama pull llama3

Write-Host "Verifying model..." -ForegroundColor Yellow
ollama list

$api = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method Post -Body (@{model="llama3";prompt="hello";stream=$false} | ConvertTo-Json) -ContentType "application/json"
Write-Host ("Test response: " + $api.response) -ForegroundColor Green

Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "Local API: http://localhost:11434" -ForegroundColor Green
