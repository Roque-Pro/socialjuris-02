# Script PowerShell para iniciar Backend + Frontend
# Use: .\START_ALL.ps1

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🚀 Iniciando SocialJuris..." -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se npm está instalado
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm não está instalado!" -ForegroundColor Red
    exit 1
}

# Matar processos anteriores na porta 10000 e 5173 (se existirem)
Write-Host "🧹 Limpando portas anteriores..." -ForegroundColor Yellow

# Tentar matar processos nas portas
Get-NetTCPConnection -LocalPort 10000 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "   Porta 10000 liberada"
}

Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "   Porta 5173 liberada"
}

Write-Host ""

# Iniciar Backend em nova janela
Write-Host "[1/2] 🔌 Iniciando Backend na porta 10000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-Command", "cd '$PSScriptRoot'; npm run dev:server" -NoNewWindow

# Aguardar um pouco para o backend iniciar
Write-Host "      Aguardando backend inicializar..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Iniciar Frontend em nova janela
Write-Host "[2/2] 🌐 Iniciando Frontend na porta 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-Command", "cd '$PSScriptRoot'; npm run dev" -NoNewWindow

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ Ambos os servidores iniciados!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Endereços:" -ForegroundColor Cyan
Write-Host "   🌐 Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "   🔌 Backend:   http://localhost:10000" -ForegroundColor White
Write-Host ""
Write-Host "💡 Dicas:" -ForegroundColor Cyan
Write-Host "   - Verifique .env tem OPENAI_API_KEY" -ForegroundColor Gray
Write-Host "   - Console do navegador: F12" -ForegroundColor Gray
Write-Host "   - Logs do backend: veja a janela que abriu" -ForegroundColor Gray
Write-Host ""
Write-Host "✋ Para parar: feche ambas as janelas abertas" -ForegroundColor Yellow
Write-Host ""

# Aguardar indefinidamente
while ($true) {
    Start-Sleep -Seconds 1
}
