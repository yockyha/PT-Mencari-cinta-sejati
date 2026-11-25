# =====================================================================
#  Server offline PT Mencari Cinta Sejati (Windows, tanpa install apa pun)
#  Dipanggil oleh jalankan-offline.bat. Menyajikan folder ini di
#  http://localhost:8080/ lalu membuka browser. Tutup jendela untuk berhenti.
# =====================================================================
param([int]$Port = 8080)
$ErrorActionPreference = 'Stop'
$Root = [IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$Mime = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'application/javascript; charset=utf-8'
  '.mjs' = 'application/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'; '.txt' = 'text/plain; charset=utf-8'; '.md' = 'text/plain; charset=utf-8'
  '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.png' = 'image/png'; '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'
}

# Cari port yang kosong (8080, 8081, ...)
$listener = $null
for ($p = $Port; $p -lt ($Port + 20); $p++) {
  $l = New-Object System.Net.HttpListener
  $l.Prefixes.Add("http://localhost:$p/")
  try { $l.Start(); $listener = $l; $Port = $p; break } catch { $l.Close() }
}
if ($null -eq $listener) {
  Write-Host 'Gagal: tidak ada port kosong antara' $Port 'dan' ($Port + 19)
  exit 1
}

$Url = "http://localhost:$Port/"
Write-Host ''
Write-Host '  PT Mencari Cinta Sejati - MODE OFFLINE'
Write-Host '  ---------------------------------------'
Write-Host "  Beranda   : $Url"
Write-Host "  Kantor 3D : ${Url}kantor/"
Write-Host "  Dashboard : ${Url}dashboard/   (username: direktur, sandi: cintasejati)"
Write-Host ''
Write-Host '  Data tersimpan di browser ini saja. Tutup jendela ini untuk berhenti.'
Write-Host ''
$Sep = [IO.Path]::DirectorySeparatorChar
try { Start-Process $Url } catch { Write-Host '  Buka alamat di atas di browser.' }

function Kirim($res, [int]$kode, [string]$teks) {
  $b = [Text.Encoding]::UTF8.GetBytes($teks)
  $res.StatusCode = $kode; $res.ContentType = 'text/plain; charset=utf-8'
  $res.OutputStream.Write($b, 0, $b.Length)
}

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request; $res = $ctx.Response
    try {
      $path = [Uri]::UnescapeDataString($req.Url.AbsolutePath)
      $rel = $path.TrimStart('/').Replace('/', $Sep)
      $full = [IO.Path]::GetFullPath((Join-Path $Root $rel))
      if (-not ($full -eq $Root -or $full.StartsWith($Root + $Sep, [StringComparison]::OrdinalIgnoreCase))) {
        Kirim $res 403 'Dilarang'
      } elseif (Test-Path -LiteralPath $full -PathType Container) {
        if (-not $path.EndsWith('/')) {
          $res.StatusCode = 301; $res.RedirectLocation = $path + '/'
        } else {
          $idx = Join-Path $full 'index.html'
          if (Test-Path -LiteralPath $idx -PathType Leaf) {
            $b = [IO.File]::ReadAllBytes($idx)
            $res.ContentType = $Mime['.html']; $res.ContentLength64 = $b.Length
            $res.OutputStream.Write($b, 0, $b.Length)
          } else { Kirim $res 404 'Tidak ditemukan' }
        }
      } elseif (Test-Path -LiteralPath $full -PathType Leaf) {
        $ext = [IO.Path]::GetExtension($full).ToLower()
        $tipe = $Mime[$ext]; if ($null -eq $tipe) { $tipe = 'application/octet-stream' }
        $b = [IO.File]::ReadAllBytes($full)
        $res.ContentType = $tipe; $res.ContentLength64 = $b.Length
        $res.Headers.Add('Cache-Control', 'no-cache')
        $res.OutputStream.Write($b, 0, $b.Length)
      } else {
        Kirim $res 404 'Tidak ditemukan'
      }
    } catch {
      try { Kirim $res 500 'Kesalahan server' } catch {}
    } finally {
      try { $res.OutputStream.Close() } catch {}
    }
  }
} finally {
  $listener.Stop()
}
