Add-Type -AssemblyName System.Drawing

function Generate-PwaIcon {
    param(
        [int]$size,
        [string]$outputPath,
        [bool]$isMaskable = $false
    )

    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

    $s = [float]$size
    $scale = $s / 512.0

    # 1. Background
    $bgRect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $bgRect,
        [System.Drawing.ColorTranslator]::FromHtml('#111827'),
        [System.Drawing.ColorTranslator]::FromHtml('#030712'),
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )
    $g.FillRectangle($bgBrush, $bgRect)
    $bgBrush.Dispose()

    # Subtle inner border for standalone icon
    if (-not $isMaskable) {
        $cornerRad = [float](48.0 * $scale)
        $framePen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#1F2937'), [float](3.0 * $scale))
        $g.DrawRectangle($framePen, [float](12.0 * $scale), [float](12.0 * $scale), [float](488.0 * $scale), [float](488.0 * $scale))
        $framePen.Dispose()
    }

    # 2. Beaker Outline Path
    # Center is at X=256, Y=240
    $beaker = New-Object System.Drawing.Drawing2D.GraphicsPath

    # Neck
    $beaker.AddLine([float](204.0 * $scale), [float](90.0 * $scale), [float](308.0 * $scale), [float](90.0 * $scale))
    $beaker.AddLine([float](308.0 * $scale), [float](110.0 * $scale), [float](290.0 * $scale), [float](110.0 * $scale))
    $beaker.AddLine([float](290.0 * $scale), [float](210.0 * $scale), [float](394.0 * $scale), [float](370.0 * $scale))
    # Bottom Right Round Corner
    $beaker.AddArc([float](364.0 * $scale), [float](350.0 * $scale), [float](44.0 * $scale), [float](44.0 * $scale), 0.0, 90.0)
    # Bottom Edge
    $beaker.AddLine([float](386.0 * $scale), [float](394.0 * $scale), [float](126.0 * $scale), [float](394.0 * $scale))
    # Bottom Left Round Corner
    $beaker.AddArc([float](104.0 * $scale), [float](350.0 * $scale), [float](44.0 * $scale), [float](44.0 * $scale), 90.0, 90.0)
    # Left Body & Neck
    $beaker.AddLine([float](104.0 * $scale), [float](370.0 * $scale), [float](222.0 * $scale), [float](210.0 * $scale))
    $beaker.AddLine([float](222.0 * $scale), [float](110.0 * $scale), [float](204.0 * $scale), [float](110.0 * $scale))
    $beaker.CloseFigure()

    # 3. Liquid inside Beaker (gradient fill from Blue to Cyan)
    $liquid = New-Object System.Drawing.Drawing2D.GraphicsPath
    $liquid.AddLine([float](155.0 * $scale), [float](300.0 * $scale), [float](357.0 * $scale), [float](300.0 * $scale))
    $liquid.AddLine([float](357.0 * $scale), [float](300.0 * $scale), [float](394.0 * $scale), [float](370.0 * $scale))
    $liquid.AddArc([float](364.0 * $scale), [float](350.0 * $scale), [float](44.0 * $scale), [float](44.0 * $scale), 0.0, 90.0)
    $liquid.AddLine([float](386.0 * $scale), [float](394.0 * $scale), [float](126.0 * $scale), [float](394.0 * $scale))
    $liquid.AddArc([float](104.0 * $scale), [float](350.0 * $scale), [float](44.0 * $scale), [float](44.0 * $scale), 90.0, 90.0)
    $liquid.CloseFigure()

    $liqRect = New-Object System.Drawing.RectangleF([float](100.0 * $scale), [float](300.0 * $scale), [float](312.0 * $scale), [float](100.0 * $scale))
    $liqBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $liqRect,
        [System.Drawing.ColorTranslator]::FromHtml('#2563EB'),
        [System.Drawing.ColorTranslator]::FromHtml('#06B6D4'),
        [System.Drawing.Drawing2D.LinearGradientMode]::Horizontal
    )
    $g.FillPath($liqBrush, $liquid)
    $liqBrush.Dispose()
    $liquid.Dispose()

    # Liquid Meniscus line (wave highlight)
    $meniscusPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#38BDF8'), [float](5.0 * $scale))
    $meniscusPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $meniscusPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($meniscusPen, [float](155.0 * $scale), [float](300.0 * $scale), [float](357.0 * $scale), [float](300.0 * $scale))
    $meniscusPen.Dispose()

    # 4. Beaker Stroke
    $beakerPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#F8FAFC'), [float](14.0 * $scale))
    $beakerPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $beakerPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $beakerPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $g.DrawPath($beakerPen, $beaker)
    $beakerPen.Dispose()
    $beaker.Dispose()

    # 5. Graduation measurement lines
    $gradPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#94A3B8'), [float](7.0 * $scale))
    $gradPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $gradPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($gradPen, [float](205.0 * $scale), [float](275.0 * $scale), [float](245.0 * $scale), [float](275.0 * $scale))
    $g.DrawLine($gradPen, [float](180.0 * $scale), [float](320.0 * $scale), [float](230.0 * $scale), [float](320.0 * $scale))
    $g.DrawLine($gradPen, [float](155.0 * $scale), [float](360.0 * $scale), [float](215.0 * $scale), [float](360.0 * $scale))
    $gradPen.Dispose()

    # 6. Highlights / Bubbles
    $bubble1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(160, 255, 255, 255))
    $g.FillEllipse($bubble1, [float](315.0 * $scale), [float](335.0 * $scale), [float](14.0 * $scale), [float](14.0 * $scale))
    $g.FillEllipse($bubble1, [float](340.0 * $scale), [float](320.0 * $scale), [float](9.0 * $scale), [float](9.0 * $scale))
    $bubble1.Dispose()

    # 7. Brand Label "MADA"
    $fontSize = [float](26.0 * $scale)
    $font = New-Object System.Drawing.Font('Arial', $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#E2E8F0'))
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString('MADA', $font, $textBrush, [float]($s / 2.0), [float](440.0 * $scale), $sf)
    $font.Dispose()
    $textBrush.Dispose()
    $sf.Dispose()

    # 8. Subtitle "QUÍMICOS"
    $subFontSize = [float](12.0 * $scale)
    $subFont = New-Object System.Drawing.Font('Arial', $subFontSize, [System.Drawing.FontStyle]::Bold)
    $subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#38BDF8'))
    $subSf = New-Object System.Drawing.StringFormat
    $subSf.Alignment = [System.Drawing.StringAlignment]::Center
    $subSf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString('QUÍMICOS', $subFont, $subBrush, [float]($s / 2.0), [float](468.0 * $scale), $subSf)
    $subFont.Dispose()
    $subBrush.Dispose()
    $subSf.Dispose()

    $g.Dispose()

    $dir = [System.IO.Path]::GetDirectoryName($outputPath)
    if (-not [string]::IsNullOrEmpty($dir) -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

Generate-PwaIcon -size 512 -outputPath 'public/pwa-512x512.png' -isMaskable $false
Generate-PwaIcon -size 512 -outputPath 'public/pwa-512x512-maskable.png' -isMaskable $true
Generate-PwaIcon -size 192 -outputPath 'public/pwa-192x192.png' -isMaskable $false
Generate-PwaIcon -size 180 -outputPath 'public/apple-touch-icon.png' -isMaskable $false
Generate-PwaIcon -size 64  -outputPath 'public/favicon-64.png' -isMaskable $false

Write-Output 'Generated all PWA icons successfully.'
