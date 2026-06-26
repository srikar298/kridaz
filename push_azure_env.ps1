$envFile = "c:\Users\saavi\OneDrive\Desktop\kridaz\kridaz\server\.env"
$jsonFile = "c:\Users\saavi\OneDrive\Desktop\kridaz\kridaz\azure_settings.json"
$rg = "kridaz-prod"
$apps = @("Kridaz", "kridaz-worker", "kridaz-web", "kridaz-admin")

$settings = @()
foreach($line in Get-Content $envFile) {
    if(![string]::IsNullOrWhiteSpace($line) -and !$line.StartsWith("#")) {
        $parts = $line -split '=', 2
        if ($parts.Length -eq 2) {
            $key = $parts[0].Trim()
            $val = $parts[1].Trim()
            if (($val.StartsWith('""') -and $val.EndsWith('""')) -or ($val.StartsWith("''") -and $val.EndsWith("''"))) {
                $val = $val.Substring(1, $val.Length - 2)
            }
            if ($key -eq "NODE_ENV") {
                $val = "production"
            }
            $settings += @{ name = $key; value = $val; slotSetting = $false }
        }
    }
}
$settings | ConvertTo-Json -Depth 10 | Out-File -FilePath $jsonFile -Encoding utf8

foreach($app in $apps) {
    Write-Host "Updating app settings for $app..."
    az webapp config appsettings set -g $rg -n $app --settings "@$jsonFile" | Out-Null
    Write-Host "Successfully updated $app!"
}

# Cleanup the temp file
Remove-Item -Path $jsonFile -Force
