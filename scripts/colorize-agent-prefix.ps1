param(
    [switch]$Passthrough
)

$agentColors = @{
    'ATLAS' = 'Cyan'
    'ARCHITECT' = 'Blue'
    'NOVA' = 'Magenta'
    'FORGE' = 'Yellow'
    'MENTOR' = 'Green'
    'TUTOR' = 'Green'
    'SENTINEL' = 'Red'
    'SCRIBE' = 'DarkCyan'
    'SHIP' = 'White'
}

function Write-ColoredLine {
    param(
        [string]$Line
    )

    if ($Line -match '^\[(?<agent>[A-Z_]+)\]') {
        $agent = $matches.agent
        $color = $agentColors[$agent]
        if ($color) {
            Write-Host $Line -ForegroundColor $color
            return
        }
    }

    if ($Passthrough) {
        Write-Output $Line
        return
    }

    Write-Host $Line
}

if ($MyInvocation.ExpectingInput) {
    foreach ($line in $input) {
        Write-ColoredLine -Line ([string]$line)
    }
    return
}

Write-Host 'Uso:' -ForegroundColor Cyan
Write-Host "  algun_comando | .\scripts\colorize-agent-prefix.ps1"
Write-Host "  Get-Content .\archivo.log -Wait | .\scripts\colorize-agent-prefix.ps1"
Write-Host ''
Write-Host 'Prefijos soportados:' -ForegroundColor Cyan
Write-Host '  [ATLAS] [ARCHITECT] [NOVA] [FORGE] [MENTOR] [TUTOR] [SENTINEL] [SCRIBE] [SHIP]'
