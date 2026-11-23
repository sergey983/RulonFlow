param(
    [string]$Root = ".",
    [string]$OutputFile = "csharp-node-export.md"
)

$outputFileName = [System.IO.Path]::GetFileName($OutputFile)

$excludeDirs = @(
    '.git', '.vs', 'bin', 'obj', 'packages', 'node_modules',
    'build', 'out', 'dist', 'venv', '__pycache__', 'Logs', 'log',
    '.idea', '.vite', 'coverage'
)

$excludeFiles = @(
    $outputFileName,
    'package-lock.json'
)

$includeExtensions = @(
    '.cs',
    '.xaml',
    '.csproj', '.sln', '.slnx',
    '.config', '.xml', '.props', '.targets',

    '.ts', '.tsx',
    '.js', '.jsx', '.mjs', '.cjs',
    '.css', '.scss', '.sass',
    '.json', '.jsonc',
    '.html',
    '.md',
    '.svg',
    '.env', '.env.local', '.env.development', '.env.production'
)

$includeFiles = @(
    '.gitignore',
    '.editorconfig',
    '.eslintrc',
    '.eslintrc.js',
    '.eslintrc.cjs',
    '.eslintrc.json',
    'eslint.config.js',
    'eslint.config.mjs',
    'vite.config.ts',
    'vite.config.js',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'package.json'
)

function Get-LanguageForExtension {
    param([string]$Extension)

    switch ($Extension.ToLowerInvariant()) {
        '.cs' { 'cs' }
        '.xaml' { 'xml' }
        '.csproj' { 'xml' }
        '.sln' { 'text' }
        '.slnx' { 'text' }
        '.config' { 'xml' }
        '.xml' { 'xml' }
        '.props' { 'xml' }
        '.targets' { 'xml' }

        '.ts' { 'ts' }
        '.tsx' { 'tsx' }
        '.js' { 'js' }
        '.jsx' { 'jsx' }
        '.mjs' { 'js' }
        '.cjs' { 'js' }

        '.css' { 'css' }
        '.scss' { 'scss' }
        '.sass' { 'sass' }

        '.json' { 'json' }
        '.jsonc' { 'json' }

        '.html' { 'html' }
        '.md' { 'markdown' }
        '.svg' { 'xml' }

        '.env' { 'bash' }
        '.env.local' { 'bash' }
        '.env.development' { 'bash' }
        '.env.production' { 'bash' }

        default { 'text' }
    }
}

function Write-FileContent {
    param(
        [System.IO.FileSystemInfo]$File,
        [string]$Indent
    )

    $extension = $File.Extension
    $language = Get-LanguageForExtension -Extension $extension

    $codeStart = $Indent + '```' + $language
    $codeEnd = $Indent + '```'

    Add-Content -Path $OutputFile -Value $codeStart

    Get-Content -Path $File.FullName -Encoding UTF8 |
        ForEach-Object { $Indent + $_ } |
        Add-Content -Path $OutputFile

    Add-Content -Path $OutputFile -Value $codeEnd
}

function Write-TreeWithContent {
    param(
        [string]$Path,
        [string]$Indent
    )

    $items = Get-ChildItem -Path $Path -Force |
    Where-Object {
        $_.Name -notin $excludeDirs -and
        $_.Name -notin $includeFiles -and
        $_.Name -notin $excludeFiles
    } |
    Sort-Object Name

    foreach ($item in $items) {
        $line = "$Indent$($item.Name)"
        Add-Content -Path $OutputFile -Value $line

        if ($item.PSIsContainer) {
            Write-TreeWithContent -Path $item.FullName -Indent "$Indent    "
        }
        elseif ($item.Extension -in $includeExtensions) {
            Write-FileContent -File $item -Indent $Indent
        }
    }

    $rootFiles = Get-ChildItem -Path $Path -File -Force |
    Where-Object {
        $_.Name -in $includeFiles -and
        $_.Name -notin $excludeFiles
    } |
    Sort-Object Name

    foreach ($file in $rootFiles) {
        $line = "$Indent$($file.Name)"
        Add-Content -Path $OutputFile -Value $line

        Write-FileContent -File $file -Indent $Indent
    }
}

Clear-Content -Path $OutputFile -ErrorAction SilentlyContinue
Write-TreeWithContent -Path $Root -Indent ""