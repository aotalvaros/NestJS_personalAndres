# PowerShell script para verificar setup del proyecto
Write-Host "🔍 Verificando setup del proyecto..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Node.js
Write-Host "1. Node.js: " -NoNewline
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✓ $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ No instalado" -ForegroundColor Red
    Write-Host "   Descarga desde: https://nodejs.org/" -ForegroundColor Yellow
}
Write-Host ""

# 2. Verificar npm
Write-Host "2. npm: " -NoNewline
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm --version
    Write-Host "✓ $npmVersion" -ForegroundColor Green
} else {
    Write-Host "✗ No instalado" -ForegroundColor Red
}
Write-Host ""

# 3. Verificar dependencies
Write-Host "3. Dependencias instaladas: " -NoNewline
if (Test-Path "node_modules") {
    Write-Host "✓" -ForegroundColor Green
} else {
    Write-Host "✗ Ejecuta: npm install --legacy-peer-deps" -ForegroundColor Red
}
Write-Host ""

# 4. Verificar PostgreSQL
Write-Host "4. PostgreSQL: " -NoNewline
if (Get-Command psql -ErrorAction SilentlyContinue) {
    $pgVersion = psql --version
    Write-Host "✓ $pgVersion" -ForegroundColor Green

    # Verificar conexión
    Write-Host "   - Conectar a orderdb: " -NoNewline
    $result = & psql -U postgres -d orderdb -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓" -ForegroundColor Green
    } else {
        Write-Host "⚠ No puede conectar" -ForegroundColor Yellow
        Write-Host "     Verifica: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD en .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ No instalado" -ForegroundColor Red
    Write-Host "   Descarga desde: https://www.postgresql.org/download/" -ForegroundColor Yellow
    Write-Host "   O usa WSL2: wsl apt-get install postgresql" -ForegroundColor Yellow
}
Write-Host ""

# 5. Verificar Redis (opcional)
Write-Host "5. Redis (opcional): " -NoNewline
if (Get-Command redis-cli -ErrorAction SilentlyContinue) {
    $redisVersion = redis-cli --version
    Write-Host "✓ $redisVersion" -ForegroundColor Green

    # Verificar conexión
    Write-Host "   - Conectar: " -NoNewline
    $result = & redis-cli ping 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓" -ForegroundColor Green
    } else {
        Write-Host "⚠ No disponible" -ForegroundColor Yellow
        Write-Host "     App usará caché en memoria" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ No instalado" -ForegroundColor Yellow
    Write-Host "     App usará caché en memoria" -ForegroundColor Yellow
}
Write-Host ""

# 6. Verificar .env
Write-Host "6. .env configurado: " -NoNewline
if (Test-Path ".env") {
    Write-Host "✓" -ForegroundColor Green
    $kafkaEnabled = Select-String -Path ".env" -Pattern "KAFKA_ENABLED" | ForEach-Object { $_.ToString().Split("=")[1] }
    $rabbitmqEnabled = Select-String -Path ".env" -Pattern "RABBITMQ_ENABLED" | ForEach-Object { $_.ToString().Split("=")[1] }
    $dbHost = Select-String -Path ".env" -Pattern "^DB_HOST=" | ForEach-Object { $_.ToString().Split("=")[1] }
    $dbName = Select-String -Path ".env" -Pattern "^DB_NAME=" | ForEach-Object { $_.ToString().Split("=")[1] }

    Write-Host "   - KAFKA_ENABLED: $kafkaEnabled" -ForegroundColor Gray
    Write-Host "   - RABBITMQ_ENABLED: $rabbitmqEnabled" -ForegroundColor Gray
    Write-Host "   - DB_HOST: $dbHost" -ForegroundColor Gray
    Write-Host "   - DB_NAME: $dbName" -ForegroundColor Gray
} else {
    Write-Host "✗ No existe" -ForegroundColor Red
    Write-Host "   Ejecuta: Copy-Item .env.development .env" -ForegroundColor Yellow
}
Write-Host ""

# 7. Verificar proyecto compilado
Write-Host "7. Proyecto compilado: " -NoNewline
if (Test-Path "dist") {
    Write-Host "✓" -ForegroundColor Green
} else {
    Write-Host "⚠ Ejecuta: npm run build" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📋 Resumen:" -ForegroundColor Cyan
Write-Host ""
Write-Host "REQUERIDO:" -ForegroundColor Green
Write-Host "  ✓ Node.js 18+" -ForegroundColor Gray
Write-Host "  ✓ npm" -ForegroundColor Gray
Write-Host "  ✓ PostgreSQL 12+ (local o remoto)" -ForegroundColor Gray
Write-Host ""
Write-Host "OPCIONAL:" -ForegroundColor Yellow
Write-Host "  ⚠ Redis (sino, usa caché en memoria)" -ForegroundColor Gray
Write-Host "  ⚠ Docker (para Kafka/RabbitMQ, pero no es necesario)" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Próximo paso:" -ForegroundColor Cyan
Write-Host "  npm run start:dev" -ForegroundColor Yellow
Write-Host ""
