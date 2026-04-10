# Rename suchmodus images in public/images/
# Run from repo root: .\scripts\rename-suchmodus-images.ps1

$dir = "$PSScriptRoot\..\public\images"

# Fix double-extension files first
$fixes = @{
    "suchmodus-polizei.jpg.png"   = "suchmodus-polizei.jpg"
    "suchmodus-reinigung.jpg.png" = "suchmodus-reinigung.jpg"
}

foreach ($old in $fixes.Keys) {
    $src = Join-Path $dir $old
    if (Test-Path $src) {
        Rename-Item -Path $src -NewName $fixes[$old]
        Write-Host "Renamed: $old -> $($fixes[$old])"
    }
}

# Hash -> target name mapping
# TODO: Öffne die Bilder und passe die Zuordnung an, falls nötig.
# Tipp: Führe zuerst .\scripts\show-images.ps1 aus, um alle Bilder zu sehen.
$renames = @{
    "11448fdfdd355cbecec3a0b04f9b0e7ad105dfc4.png"    = "suchmodus-20er.jpg"
    "214a722b6adc67d07b3b17c304f990b68dcba422.png"    = "suchmodus-barock-herren.jpg"
    "462651a78a7c0dad5e34c0ef6617473d3f283808.jpg"    = "suchmodus-barock-scene.jpg"
    "5182e92d8e7299efb38b776a19c39daae9ac7172.png"    = "suchmodus-feuerwehr.jpg"
    "53b2b9144261542cfe70b5435dfd8ec134c82380.png"    = "suchmodus-oper.jpg"
    "76358c2c42ad61f9dad82fb4dc831d5f2cf67a69.png"    = "suchmodus-oper-scene.jpg"
    "7790691e3bf017939c663fb5778737c6f3c5670b.jpg"    = "suchmodus-schauspiel.jpg"
    "9654bde3d1d442d228577e68da220ba2347fb825.png"    = "suchmodus-anzuege.jpg"
    "a55bf4380a5160173a56cd84c8efaa09dffdbac1.png"    = "suchmodus-jumpsuit.jpg"
    "b9cc3d9f170ef99efb757e05b15bbaed26023078.jpg"    = "suchmodus-barock.jpg"
    "c62355f412f0361aed9d3436f551573277f4dc54.png"    = "suchmodus-tanz.jpg"
    "cc10f0a259f282a2807f05e8631c7d399f7cc31d.png"    = "suchmodus-80er.jpg"
}

foreach ($old in $renames.Keys) {
    $src = Join-Path $dir $old
    $dst = Join-Path $dir $renames[$old]
    if (Test-Path $src) {
        Rename-Item -Path $src -NewName $renames[$old]
        Write-Host "Renamed: $old -> $($renames[$old])"
    } else {
        Write-Host "NOT FOUND: $old" -ForegroundColor Yellow
    }
}

Write-Host "`nFertig." -ForegroundColor Green
