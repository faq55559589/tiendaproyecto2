$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $root 'backend'
$envExample = Join-Path $backendDir '.env.example'
$envFile = Join-Path $backendDir '.env'
$nodeCmd = Join-Path ${env:ProgramFiles} 'nodejs\node.exe'
$npmCmd = Join-Path ${env:ProgramFiles} 'nodejs\npm.cmd'

if (-not (Test-Path $nodeCmd) -or -not (Test-Path $npmCmd)) {
    Write-Error 'Node.js no esta instalado en C:\Program Files\nodejs. Instala Node.js LTS y vuelve a ejecutar este script.'
}

if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
    $generatedSecret = [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
    $content = Get-Content $envFile -Raw
    $content = $content -replace 'JWT_SECRET=reemplazar_por_secreto_largo_y_unico', "JWT_SECRET=$generatedSecret"
    $content = $content -replace 'EMAIL_REQUIRED=false', 'EMAIL_REQUIRED=false'
    Set-Content -Path $envFile -Value $content -Encoding UTF8
    Write-Host 'backend/.env creado desde .env.example'
} else {
    Write-Host 'backend/.env ya existe; no se sobreescribe.'
}

& $npmCmd --prefix $backendDir install

Write-Host ''
Write-Host 'Entorno listo.'
Write-Host 'Backend:  cd backend; npm run dev'
Write-Host 'Frontend: node scripts\serve-frontend.js'
