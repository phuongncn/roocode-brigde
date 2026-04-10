param(
    [int]$ExpectedSeconds = 100,
    [int]$MaxPolls = 10,
    [string]$BridgeUrl = "http://127.0.0.1:3457"
)
$Interval = [Math]::Max(1, [Math]::Floor($ExpectedSeconds / $MaxPolls))
for ($i = 1; $i -le $MaxPolls; $i++) {
    $status = Invoke-WebRequest -Uri "$BridgeUrl/status" -UseBasicParsing | Select-Object -ExpandProperty Content
    Write-Host "Poll $i`: $status"
    if ($status -match '"done"' -or $status -match '"error"') { break }
    Start-Sleep -Seconds $Interval
}
Write-Output $status
