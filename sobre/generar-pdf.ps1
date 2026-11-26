<#
  Genera "Sobre-Bodas-de-Plata.pdf" a partir de sobre.html usando Chrome o Edge
  en modo "headless" (sin abrir ventanas). El botón del PDF apuntará a -Url.

  Uso (desde la carpeta del proyecto):
    powershell -ExecutionPolicy Bypass -File sobre\generar-pdf.ps1 -Url "https://tu-usuario.github.io/bodas-de-plata/"
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$Url,
  [string]$Salida = ""
)

# Carpeta del script (en PowerShell 5.1 $PSScriptRoot no existe dentro de param)
$aqui = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $Salida) { $Salida = Join-Path $aqui "Sobre-Bodas-de-Plata.pdf" }

if ($Url -notmatch '^https?://') { throw "La URL debe empezar con http:// o https://" }

# Busca Chrome o Edge
$candidatos = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LocalAppData\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)
$navegador = $candidatos | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $navegador) { throw "No se encontró Chrome ni Edge. Exporta manualmente con Ctrl+P (ver sobre.html)." }

$html = (Resolve-Path (Join-Path $aqui "sobre.html")).Path
$fileUrl = ([System.Uri]$html).AbsoluteUri + "?url=" + [System.Uri]::EscapeDataString($Url)
$perfil = Join-Path $env:TEMP ("sobre-pdf-" + [guid]::NewGuid())

& $navegador --headless=new --disable-gpu --no-first-run --user-data-dir="$perfil" `
  --no-pdf-header-footer --print-to-pdf-no-header `
  --virtual-time-budget=10000 --run-all-compositor-stages-before-draw `
  --print-to-pdf="$Salida" "$fileUrl" 2>$null | Out-Null

Start-Sleep -Milliseconds 500
Remove-Item -Recurse -Force $perfil -ErrorAction SilentlyContinue

if (Test-Path $Salida) {
  Write-Host "PDF generado: $Salida" -ForegroundColor Green
  Write-Host "El botón apunta a: $Url"
} else {
  throw "No se pudo generar el PDF."
}
