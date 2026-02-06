# Sync Generated Assets Manifest
# Run this after generating new images to update the app

$source = Join-Path $PSScriptRoot "generate-assets\output\manifest.json"
$dest = Join-Path $PSScriptRoot "..\src\data\generated-manifest.json"

if (Test-Path $source) {
    Copy-Item $source $dest -Force
    Write-Host "✓ Manifest synced to src/data/generated-manifest.json" -ForegroundColor Green
    
    # Show stats
    $manifest = Get-Content $source | ConvertFrom-Json
    Write-Host ""
    Write-Host "Asset Stats:" -ForegroundColor Cyan
    Write-Host "  Total Assets: $($manifest.stats.totalAssets)"
    $manifest.stats.byCategory.PSObject.Properties | ForEach-Object {
        Write-Host "  - $($_.Name): $($_.Value)"
    }
} else {
    Write-Host "✗ Manifest not found at: $source" -ForegroundColor Red
    Write-Host "  Run the asset generator first!" -ForegroundColor Yellow
}
