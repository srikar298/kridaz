$envFile = "c:\Users\saavi\OneDrive\Desktop\kridaz\kridaz\client\user\.env"
$jsonFile = "c:\Users\saavi\OneDrive\Desktop\kridaz\kridaz\azure_settings_web.json"
$rg = "kridaz-prod"
$apps = @("kridaz-web")

$settings = @()
foreach($line in Get-Content $envFile) {
    if(![string]::IsNullOrWhiteSpace($line) -and !$line.StartsWith("#")) {
        $parts = $line -split '=', 2
        if ($parts.Length -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim()
            $value = $value -replace '^"|"$', ''
            $settings += @{ name = $key; value = $value; slotSetting = $false }
        }
    }
}
$settings | ConvertTo-Json -Depth 10 | Out-File -FilePath $jsonFile -Encoding utf8

foreach($app in $apps) {
    Write-Host "Updating app settings for $app..."
    az webapp config appsettings set -g $rg -n $app --settings "@$jsonFile" | Out-Null
    Write-Host "Successfully updated $app!"
}
Remove-Item -Path $jsonFile -Force
