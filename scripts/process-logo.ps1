Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\kisha\.gemini\antigravity\brain\f5a66192-2653-4b4d-bacf-e9c320a29cbd\.user_uploaded\media_1794657096327_58d9fbb5.jpg"
$destDir = "C:\Users\kisha\.gemini\antigravity\scratch\chess-clock\assets"

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

$srcImg = [System.Drawing.Image]::FromFile($sourcePath)

# 1. Exact PNG copy for branding
$srcImg.Save("$destDir\chess-clock-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 2. Main app icon (1024x1024)
$srcImg.Save("$destDir\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

function Create-PaddedIcon($targetWidth, $targetHeight, $innerScale, $bgColor, $outputPath) {
    $bmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($bgColor))
    $g.FillRectangle($brush, 0, 0, $targetWidth, $targetHeight)
    $brush.Dispose()
    
    $drawW = [int]($targetWidth * $innerScale)
    $drawH = [int]($targetHeight * $innerScale)
    $drawX = [int](($targetWidth - $drawW) / 2)
    $drawY = [int](($targetHeight - $drawH) / 2)
    
    $g.DrawImage($srcImg, $drawX, $drawY, $drawW, $drawH)
    $g.Dispose()
    
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

# 3. Android Adaptive Icon Foreground (1024x1024, scaled to 72% so Android circular mask never clips the neon border)
Create-PaddedIcon 1024 1024 0.72 "#0c0e12" "$destDir\adaptive-icon.png"

# 4. Splash Screen Icon (1024x1024, scaled to 60% with #0c0e12 background)
Create-PaddedIcon 1024 1024 0.60 "#0c0e12" "$destDir\splash-icon.png"

# 5. Website Favicon (48x48)
Create-PaddedIcon 48 48 1.0 "#0c0e12" "$destDir\favicon.png"

# 6. Web/PWA App Icons (192x192 and 512x512)
Create-PaddedIcon 192 192 1.0 "#0c0e12" "$destDir\icon-192.png"
Create-PaddedIcon 512 512 1.0 "#0c0e12" "$destDir\icon-512.png"

$srcImg.Dispose()

Write-Host "✓ All logo variations created successfully in $destDir"
