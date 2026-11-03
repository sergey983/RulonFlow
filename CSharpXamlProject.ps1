param(
    [string]$Root = ".",
    [string]$OutputFile = "csharp-xaml-export.md"
)

$excludeDirs = @(
    '.git', '.vs', 'bin', 'obj', 'packages', 'node_modules',
    'build', 'out', 'dist', 'venv', '__pycache__', 'Logs', 'log'
)

$includeExtensions = @(
    '.cs',
    '.xaml',
    '.csproj', '.sln',
    '.config', '.xml', '.props', '.targets'
)

function Write-TreeWithContent {
    param(
        [string]$Path,
        [string]$Indent
    )

    $items = Get-ChildItem -Path $Path -Force |
        Where-Object { $_.Name -notin $excludeDirs } |
        Sort-Object Name

    foreach ($item in $items) {
        $line = "$Indent$($item.Name)"
        Add-Content -Path $OutputFile -Value $line

        if ($item.PSIsContainer) {
            Write-TreeWithContent -Path $item.FullName -Indent "$Indent    "
        }
        elseif ($item.Extension -in $includeExtensions) {
            $ext = $item.Extension.TrimStart('.')

            # Открывающий блок кода Markdown
            $codeStart = '```' + $ext
            Add-Content -Path $OutputFile -Value $codeStart

            Get-Content -Path $item.FullName -Encoding UTF8 | Add-Content -Path $OutputFile

            # Закрывающий блок кода Markdown
            $codeEnd = '```'
            Add-Content -Path $OutputFile -Value $codeEnd
        }
    }
}

Clear-Content -Path $OutputFile -ErrorAction SilentlyContinue
Write-TreeWithContent -Path $Root -Indent ""