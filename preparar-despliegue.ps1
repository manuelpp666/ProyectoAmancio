# =============================================================================
# Prepara el paquete del frontend para subir a cPanel.
#
# Hace las tres cosas que 'npm run build' NO hace por si solo:
#
#   1. Comprueba que el build NO lleva localhost incrustado. Las variables
#      NEXT_PUBLIC_* se meten dentro del JavaScript al compilar, no se leen en
#      el servidor: si compilas con el .env local, la web publicada intenta
#      llamar a localhost:8000 desde el navegador del visitante y no funciona.
#
#   2. Copia .next/static y public dentro de .next/standalone, que es donde el
#      servidor los busca. Sin este paso la web carga sin estilos ni imagenes.
#
#   3. Comprime la carpeta standalone, dejando FUERA los .env para no pisar el
#      del servidor (que es el bueno).
#
# Antes de ejecutarlo hay que compilar con la configuracion de produccion:
#
#     npm run build
#
# leyendo un .env.production.local con la URL real del backend.
#
# Uso:
#     powershell -ExecutionPolicy Bypass -File preparar-despliegue.ps1
# =============================================================================

$ErrorActionPreference = "Stop"
$raiz = $PSScriptRoot
Set-Location $raiz

$standalone = Join-Path $raiz ".next\standalone"
$destinoZip = Join-Path $raiz "Front_para_subir.zip"

# --- 0) Que exista un build ---
if (-not (Test-Path (Join-Path $raiz ".next\BUILD_ID"))) {
    throw "No hay build. Ejecuta 'npm run build' primero."
}
$buildId = Get-Content (Join-Path $raiz ".next\BUILD_ID")
Write-Host "BUILD_ID: $buildId"

# --- 1) Comprobar que no viaja localhost dentro del JavaScript ---
Write-Host "`nComprobando que el build no apunta a localhost..."
$conLocalhost = Get-ChildItem (Join-Path $raiz ".next\static") -Recurse -File |
    Where-Object { $_.Extension -in ".js", ".css" } |
    Where-Object { Select-String -Path $_.FullName -Pattern "localhost:\d+" -Quiet }

if ($conLocalhost) {
    Write-Host "`n  ABORTADO: $($conLocalhost.Count) archivos del build llevan localhost dentro." -ForegroundColor Red
    Write-Host "  Este paquete NO sirve para produccion: el navegador del visitante"
    Write-Host "  intentaria llamar a tu propio equipo."
    Write-Host "`n  Solucion: crea el archivo .env.production.local con la URL real"
    Write-Host "  del backend y vuelve a ejecutar 'npm run build'."
    Write-Host "`n  Ejemplos de archivos afectados:"
    $conLocalhost | Select-Object -First 5 | ForEach-Object { Write-Host "    $($_.Name)" }
    throw "Build apuntando a localhost."
}
Write-Host "  OK: ninguna referencia a localhost."

# --- 2) Copiar static y public dentro de standalone ---
Write-Host "`nCopiando static y public dentro de standalone..."

$staticOrigen  = Join-Path $raiz ".next\static"
$staticDestino = Join-Path $standalone ".next\static"
if (Test-Path $staticDestino) { Remove-Item $staticDestino -Recurse -Force }
Copy-Item $staticOrigen $staticDestino -Recurse
Write-Host "  .next/static -> standalone/.next/static"

$publicOrigen  = Join-Path $raiz "public"
$publicDestino = Join-Path $standalone "public"
if (Test-Path $publicDestino) { Remove-Item $publicDestino -Recurse -Force }
Copy-Item $publicOrigen $publicDestino -Recurse
Write-Host "  public       -> standalone/public"

# --- 3) Comprimir standalone sin los .env ---
Write-Host "`nComprimiendo (sin los .env, para no pisar el del servidor)..."

$temporal = Join-Path $env:TEMP ("despliegue_" + [guid]::NewGuid().ToString("N").Substring(0, 8))
$copiaStandalone = Join-Path $temporal "standalone"
New-Item -ItemType Directory -Path $temporal -Force | Out-Null
Copy-Item $standalone $copiaStandalone -Recurse

Get-ChildItem $copiaStandalone -Recurse -Force -Filter ".env*" |
    ForEach-Object { Write-Host "  excluido: $($_.Name)"; Remove-Item $_.FullName -Force }

if (Test-Path $destinoZip) { Remove-Item $destinoZip -Force }
Compress-Archive -Path $copiaStandalone -DestinationPath $destinoZip -CompressionLevel Optimal
Remove-Item $temporal -Recurse -Force

$mb = [math]::Round((Get-Item $destinoZip).Length / 1MB, 2)
Write-Host "`nLISTO: $destinoZip  ($mb MB)"
Write-Host @"

Para subirlo:
  1. En cPanel, Administrador de archivos, entra en public_html/.next
  2. Cargar -> Front_para_subir.zip
  3. Seleccionalo y pulsa Extraer (sobrescribe la carpeta standalone)
  4. Borra el zip del servidor
  5. Reinicia: Setup Node.js App -> Restart
     (o crea un archivo vacio restart.txt en standalone/tmp)

El .env del servidor no se toca: no va dentro del zip.
"@
