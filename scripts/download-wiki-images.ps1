# AMS2 Wiki Image Downloader
# Downloads all car and track images from the Automobilista 2 wiki

param(
    [string]$OutputDir = "public/images",
    [switch]$CarsOnly,
    [switch]$TracksOnly,
    [switch]$Force
)

$ErrorActionPreference = "Continue"

# Base URL for wiki images
$BaseUrl = "https://automobilista2.wiki.gg/images"

# Create output directories
$CarsDir = Join-Path $OutputDir "cars"
$TracksDir = Join-Path $OutputDir "tracks"

if (-not $TracksOnly) {
    New-Item -ItemType Directory -Force -Path $CarsDir | Out-Null
}
if (-not $CarsOnly) {
    New-Item -ItemType Directory -Force -Path $TracksDir | Out-Null
}

# Car images to download (from the wiki)
$CarImages = @(
    # Karts
    "Kart_4t_rental.jpg",
    "Kart_4t_race.jpg",
    "Kart_125cc.jpg",
    "Kart_shifter.jpg",
    "Superkart.jpg",
    "Kartcross.jpg",
    
    # Formula
    "F_vee.jpg",
    "F_trainer.jpg",
    "F_trainer_adv.jpg",
    "F3.jpg",
    "F_inter.jpg",
    "F_ultimate.jpg",
    "F_usa_2023.jpg",
    "F_reiza.jpg",
    
    # GT
    "Gt5.jpg",
    "Ginetta_g40.jpg",
    "Cayman_gt5.jpg",
    "Gt4.jpg",
    "Vantage_gt4.jpg",
    "M4_gt4.jpg",
    "Camaro_gt4.jpg",
    "G55_gt4.jpg",
    "Xbow_gt4.jpg",
    "Maserati_gt4.jpg",
    "Mclaren_gt4.jpg",
    "Amg_gt4.jpg",
    "Cayman_gt4_mr.jpg",
    "R8_gt3_v2.jpg",
    "M6_v2.jpg",
    "720s_v2.jpg",
    "Amg_gt3_v2.jpg",
    "Gtr_gt3.jpg",
    "911_gt3r.jpg",
    "Gt3_gen2.jpg",
    "R8_gt3_evo2.jpg",
    "M4_gt3.jpg",
    "296_gt3.jpg",
    "Huracan_gt3_evo2.jpg",
    "720s_gt3_evo.jpg",
    "Amg_gt3_evo.jpg",
    "992_gt3r.jpg",
    "Z06_gt3r.jpg",
    "Gte.jpg",
    "Vantage_gte.jpg",
    "M8_gte.jpg",
    "488_gte.jpg",
    "911_rsr.jpg",
    "Ginetta_g55.jpg",
    "Carrera_cup.jpg",
    "Gt3_cup_38.jpg",
    "Gt3_cup_40.jpg",
    "Super_trofeo.jpg",
    "Caterham_academy.jpg",
    "Caterham_superlight.jpg",
    "Caterham_supersport.jpg",
    "Caterham_620r.jpg",
    "Mini_jcw.jpg",
    
    # Prototypes
    "P4.jpg",
    "Metalmoro_p4.jpg",
    "Sigma_p4.jpg",
    "P3.jpg",
    "Ligier_p3.jpg",
    "Norma_m30.jpg",
    "Ginetta_g57.jpg",
    "P2.jpg",
    "Mcr_2000.jpg",
    "Metalmoro_p2.jpg",
    "Lmp2_gen1.jpg",
    "Oreca_07.jpg",
    "Dallara_p217.jpg",
    "Lmp2_gen2.jpg",
    "Oreca_07_gen2.jpg",
    "Ligier_jsp320.jpg",
    "P1_gen1.jpg",
    "Metalmoro_mg1.jpg",
    "Sigma_p1.jpg",
    "P1_gen2.jpg",
    "Metalmoro_mg1_gen2.jpg",
    "Hypercar.jpg",
    "Gr010.jpg",
    "9x8.jpg",
    "499p.jpg",
    "963.jpg",
    "Cadillac_vlmdh.jpg",
    "Lmdh.jpg",
    "Arx06.jpg",
    "M_hybrid.jpg",
    "Cadillac_lmdh.jpg",
    "Porsche_963.jpg",
    "Sc63.jpg",
    "A424.jpg",
    
    # Touring
    "Tsi_cup.jpg",
    "Golf_tsi.jpg",
    "Virtus_tsi.jpg",
    "Polo_tsi.jpg",
    "Jetta_tsi.jpg",
    "Lancer_cup.jpg",
    "Lancer_rs.jpg",
    "Sprint_race.jpg",
    "Corolla_sr.jpg",
    "Super_v8.jpg",
    "Arc.jpg",
    "Arc_camaro.jpg",
    "Supercar.jpg",
    "Falcon_fg.jpg",
    "Commodore_vf.jpg",
    "Mustang_s550.jpg",
    "Zb_commodore.jpg",
    "Camaro_sc.jpg",
    "Mustang_gen3.jpg",
    
    # Stock Cars
    "Stock_2024.jpg",
    "Cruze_2024.jpg",
    "Corolla_2024.jpg",
    "Stock_2023.jpg",
    "Cruze_2023.jpg",
    "Corolla_2023.jpg",
    "Stock_2022.jpg",
    "Cruze_2022.jpg",
    "Corolla_2022.jpg",
    "Nascar_gen3.jpg",
    "Nascar_gen3_lm.jpg",
    "Nascar_gen2.jpg",
    "Nascar_gen1.jpg",
    "Old_stock.jpg",
    "Opala_old.jpg",
    
    # Rallycross
    "Rallycross.jpg",
    "Fiesta_rx.jpg",
    "208_rx.jpg",
    "Polo_rx.jpg",
    "S1_rx.jpg",
    "Trophy_truck.jpg",
    
    # Road Cars
    "Street_car.jpg",
    "Mclaren_720s.jpg",
    
    # Ligier European
    "Ligier_european.jpg",
    "Ligier_js2r.jpg",
    "Ligier_jsp4.jpg",
    
    # Historic/Vintage
    "F_classic_g1.jpg",
    "Lotus_79.jpg",
    "Brabham_bt46.jpg",
    "F_classic_g2.jpg",
    "Mp4_4.jpg",
    "Lotus_98t.jpg",
    "F_classic_g3.jpg",
    "Fw14b.jpg",
    "Mp4_6.jpg",
    "F_retro.jpg",
    "F2004.jpg",
    "Mp4_20.jpg",
    "Group_c.jpg",
    "Porsche_962c.jpg",
    "Xjr9.jpg",
    "Sauber_c9.jpg",
    "R89c.jpg",
    "Group_a.jpg",
    "Mercedes_190e.jpg",
    "M3_e30.jpg",
    "Alfa_155.jpg",
    "Gt1.jpg",
    "F1_gtr.jpg",
    "Clk_gtr.jpg",
    "911_gt1.jpg",
    "R390.jpg",
    "Gt1_2005.jpg",
    "Mc12_gt1.jpg",
    "S7r.jpg",
    "C6r_gt1.jpg",
    "Dbr9.jpg",
    "550_maranello.jpg",
    "Gt2_2005.jpg",
    "F430_gt2.jpg",
    "996_rsr.jpg",
    "Gt_open.jpg",
    "458_gt_open.jpg",
    "997_gt_open.jpg",
    "Gt_classic.jpg",
    "512m.jpg",
    "917k.jpg",
    "Gt40.jpg",
    "Lmp1_2005.jpg",
    "Audi_r8_lmp.jpg",
    "C60.jpg",
    "Zytek_05s.jpg",
    "Lmp2_2005.jpg",
    "Lola_b05.jpg",
    "Sr9.jpg",
    "Gtr_2004.jpg",
    "575_gtc.jpg",
    "M1_procar.jpg",
    "Hot_cars.jpg",
    "Opala_hot.jpg",
    "Maverick_hot.jpg",
    "Passat_hot.jpg",
    "Charger_hot.jpg",
    "Stock_1979.jpg",
    "Opala_1979.jpg",
    "Stock_1986.jpg",
    "Opala_1986.jpg",
    "Stock_1999.jpg",
    "Omega_1999.jpg",
    "Vtc_t1.jpg",
    "Capri_vtc.jpg",
    "Bmw_csl.jpg",
    "Carrera_rsr.jpg",
    "Vtc_t2.jpg",
    "Mini_65.jpg",
    "Alfa_gta.jpg",
    "Copa_classic_b.jpg",
    "Chevette_classic.jpg",
    "Uno_classic.jpg",
    "Gol_classic.jpg",
    "Passat_classic.jpg",
    "Mini_classic.jpg",
    "Puma_gte.jpg",
    "Copa_classic_fl.jpg",
    "Puma_gtb.jpg",
    "Diablo.jpg",
    "Miura.jpg"
)

# Track images to download
$TrackImages = @(
    "Adelaide.jpg",
    "Barcelona.jpg",
    "Bathurst.jpg",
    "Brands_hatch.jpg",
    "Brasilia.jpg",
    "Buenos_aires.jpg",
    "Buskerud.jpg",
    "Cadwell_park.jpg",
    "Campo_grande.jpg",
    "Cascavel.jpg",
    "Cleveland.jpg",
    "Cordoba.jpg",
    "Curitiba.jpg",
    "Curvelo.jpg",
    "Daytona.jpg",
    "Donington.jpg",
    "Estoril.jpg",
    "Fontana.jpg",
    "Foz.jpg",
    "Galeao.jpg",
    "Gateway.jpg",
    "Goiania.jpg",
    "Granja_viana.jpg",
    "Guapore.jpg",
    "Hockenheim.jpg",
    "Ibarra.jpg",
    "Imola.jpg",
    "Indianapolis.jpg",
    "Interlagos.jpg",
    "Jacarepagua.jpg",
    "Jerez.jpg",
    "Kansai.jpg",
    "Kyalami.jpg",
    "Laguna_seca.jpg",
    "Le_mans.jpg",
    "Londrina.jpg",
    "Long_beach.jpg",
    "Montreal.jpg",
    "Monza.jpg",
    "Mosport.jpg",
    "Nurburgring.jpg",
    "Ortona.jpg",
    "Oulton_park.jpg",
    "Pocono.jpg",
    "Road_america.jpg",
    "Road_atlanta.jpg",
    "Salvador.jpg",
    "Santa_cruz.jpg",
    "Sebring.jpg",
    "Silverstone.jpg",
    "Snetterton.jpg",
    "Spa.jpg",
    "Speedland.jpg",
    "Spielberg.jpg",
    "Taruma.jpg",
    "Termas.jpg",
    "Tykki.jpg",
    "Velo_citta.jpg",
    "Velopark.jpg",
    "Vir.jpg",
    "Watkins_glen.jpg",
    "Azure.jpg"
)

function Download-Image {
    param(
        [string]$FileName,
        [string]$OutputPath
    )
    
    $url = "$BaseUrl/$FileName"
    $outputFile = Join-Path $OutputPath $FileName
    
    if (-not $Force -and (Test-Path $outputFile)) {
        Write-Host "  Skipping (exists): $FileName" -ForegroundColor Yellow
        return $true
    }
    
    try {
        Write-Host "  Downloading: $FileName" -ForegroundColor Cyan
        
        # Use Invoke-WebRequest with error handling
        $response = Invoke-WebRequest -Uri $url -OutFile $outputFile -PassThru -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host "    Success!" -ForegroundColor Green
            return $true
        }
    }
    catch {
        # Try alternative URL patterns
        $altUrls = @(
            "$BaseUrl/$($FileName.Replace('_', '%20'))",
            "$BaseUrl/$($FileName.ToLower())",
            "$BaseUrl/$($FileName.Replace('.jpg', '.png'))"
        )
        
        foreach ($altUrl in $altUrls) {
            try {
                $response = Invoke-WebRequest -Uri $altUrl -OutFile $outputFile -PassThru -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                    Write-Host "    Success (alt URL)!" -ForegroundColor Green
                    return $true
                }
            }
            catch {
                continue
            }
        }
        
        Write-Host "    Failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Download car images
if (-not $TracksOnly) {
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "Downloading Car Images" -ForegroundColor Magenta
    Write-Host "========================================`n" -ForegroundColor Magenta
    
    $successCount = 0
    $failCount = 0
    
    foreach ($image in $CarImages) {
        $result = Download-Image -FileName $image -OutputPath $CarsDir
        if ($result) { $successCount++ } else { $failCount++ }
    }
    
    Write-Host "`nCar Images: $successCount success, $failCount failed" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Yellow" })
}

# Download track images
if (-not $CarsOnly) {
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "Downloading Track Images" -ForegroundColor Magenta
    Write-Host "========================================`n" -ForegroundColor Magenta
    
    $successCount = 0
    $failCount = 0
    
    foreach ($image in $TrackImages) {
        $result = Download-Image -FileName $image -OutputPath $TracksDir
        if ($result) { $successCount++ } else { $failCount++ }
    }
    
    Write-Host "`nTrack Images: $successCount success, $failCount failed" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Yellow" })
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Download Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Images saved to: $OutputDir"











