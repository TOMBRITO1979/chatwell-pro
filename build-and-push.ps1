# PowerShell script para build e push da imagem Docker
# Execute com: .\build-and-push.ps1

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Building Docker Image with Super Admin" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Docker está rodando
try {
    docker ps | Out-Null
} catch {
    Write-Host "ERROR: Docker não está rodando!" -ForegroundColor Red
    Write-Host "Inicie o Docker Desktop e tente novamente." -ForegroundColor Yellow
    pause
    exit 1
}

# Gerar timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
Write-Host "Timestamp: $timestamp" -ForegroundColor Green

# Build da imagem
Write-Host ""
Write-Host "Building image..." -ForegroundColor Yellow
docker build -t tomautomations/chatwell-pro:latest `
             -t tomautomations/chatwell-pro:super-admin `
             -t tomautomations/chatwell-pro:$timestamp .

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Tags created:" -ForegroundColor Cyan
Write-Host "- tomautomations/chatwell-pro:latest" -ForegroundColor White
Write-Host "- tomautomations/chatwell-pro:super-admin" -ForegroundColor White
Write-Host "- tomautomations/chatwell-pro:$timestamp" -ForegroundColor White
Write-Host ""

# Perguntar se quer fazer push
$push = Read-Host "Push to Docker Hub? (y/n)"
if ($push -ne "y") {
    Write-Host ""
    Write-Host "Push cancelled. You can push later with:" -ForegroundColor Yellow
    Write-Host "docker push tomautomations/chatwell-pro:latest" -ForegroundColor White
    Write-Host "docker push tomautomations/chatwell-pro:super-admin" -ForegroundColor White
    Write-Host "docker push tomautomations/chatwell-pro:$timestamp" -ForegroundColor White
    pause
    exit 0
}

Write-Host ""
Write-Host "Pushing images to Docker Hub..." -ForegroundColor Yellow
Write-Host ""

docker push tomautomations/chatwell-pro:latest
docker push tomautomations/chatwell-pro:super-admin
docker push tomautomations/chatwell-pro:$timestamp

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Push failed! Make sure you are logged in:" -ForegroundColor Red
    Write-Host "docker login" -ForegroundColor White
    pause
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Images pushed successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "You can now update your stack with:" -ForegroundColor Cyan
Write-Host "- tomautomations/chatwell-pro:latest" -ForegroundColor White
Write-Host "- tomautomations/chatwell-pro:$timestamp" -ForegroundColor White
Write-Host ""
Write-Host "Super Admin setup is complete!" -ForegroundColor Green
Write-Host "Access: https://app.chatwell.pro/super-admin/login" -ForegroundColor Cyan
Write-Host "Usuario: admin" -ForegroundColor White
Write-Host "Senha: Admin@2025" -ForegroundColor White
Write-Host ""
pause
