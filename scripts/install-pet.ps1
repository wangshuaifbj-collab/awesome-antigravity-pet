Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-NormalizedRawBase {
  param([string]$Value)

  $uri = [Uri]$Value
  if ($uri.Scheme -ne "https") {
    throw "The raw base URL must use HTTPS"
  }
  return $Value.TrimEnd("/")
}

function Assert-NoReparsePoint {
  param(
    [string]$Path,
    [string]$Label
  )

  $item = Get-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
  if ($null -eq $item) { return }
  if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
    throw "$Label must not be a symbolic link or reparse point: $Path"
  }
}

function Assert-NoReparseTree {
  param([string]$Path)

  Assert-NoReparsePoint -Path $Path -Label "Existing pet package"
  $children = Get-ChildItem -LiteralPath $Path -Force -Recurse -ErrorAction Stop
  foreach ($child in $children) {
    if (($child.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
      throw "Existing pet package contains a reparse point: $($child.FullName)"
    }
  }
}

function Assert-ManagedPetPackage {
  param([string]$Path)

  Assert-NoReparseTree -Path $Path
  $allowed = @("pet.json", "spritesheet.webp")
  foreach ($child in Get-ChildItem -LiteralPath $Path -Force -ErrorAction Stop) {
    if ($allowed -notcontains $child.Name) {
      throw "Existing pet package contains an unmanaged file; refusing to replace it: $($child.FullName)"
    }
    if ($child.PSIsContainer) {
      throw "Existing pet package entry is not a file: $($child.FullName)"
    }
  }
}

function Download-CodexPetFile {
  param(
    [string]$Uri,
    [string]$Destination,
    [int]$MaxBytes
  )

  Invoke-WebRequest -UseBasicParsing -MaximumRedirection 5 -Uri $Uri -OutFile $Destination -TimeoutSec 120 -ErrorAction Stop
  $size = (Get-Item -LiteralPath $Destination -Force).Length
  if ($size -gt $MaxBytes) {
    Remove-Item -LiteralPath $Destination -Force -ErrorAction SilentlyContinue
    throw "Downloaded file exceeds the $MaxBytes-byte safety limit"
  }
}

function Get-Sha256 {
  param([string]$Path)
  return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
}

function Assert-Webp {
  param([string]$Path)

  $bytes = [IO.File]::ReadAllBytes($Path)
  if ($bytes.Length -lt 12) { throw "spritesheet.webp is not a WebP image" }
  $riff = [Text.Encoding]::ASCII.GetString($bytes, 0, 4)
  $webp = [Text.Encoding]::ASCII.GetString($bytes, 8, 4)
  if ($riff -ne "RIFF" -or $webp -ne "WEBP") {
    throw "spritesheet.webp is not a WebP image"
  }
}

function Install-CodexPet {
  param(
    [Parameter(Position = 0)]
    [string]$PetId,

    [switch]$List,

    [string]$CodexHome = $env:CODEX_HOME,

    [string]$RawBase = $env:AWESOME_CODEX_PET_RAW_BASE,

    [switch]$Force,

    [switch]$NoStats
  )

  if ([string]::IsNullOrWhiteSpace($RawBase)) {
    $RawBase = "https://raw.githubusercontent.com/legeling/awesome-codex-pet/main"
  }
  $RawBase = Get-NormalizedRawBase $RawBase

  if ([string]::IsNullOrWhiteSpace($CodexHome)) {
    $CodexHome = Join-Path $env:USERPROFILE ".codex"
  }

  if ($List) {
    if (-not [string]::IsNullOrWhiteSpace($PetId)) {
      throw "-List cannot be combined with a pet id"
    }
    $listPath = Join-Path ([IO.Path]::GetTempPath()) ("codex-pets-list-" + [guid]::NewGuid().ToString("N") + ".json")
    try {
      Download-CodexPetFile -Uri "$RawBase/pets.json" -Destination $listPath -MaxBytes 1000000
      $catalog = Get-Content -LiteralPath $listPath -Raw | ConvertFrom-Json
      foreach ($pet in $catalog) {
        $version = if ($null -eq $pet.spriteVersionNumber) { 1 } else { $pet.spriteVersionNumber }
        "{0} - {1} (v{2})" -f $pet.slug, $pet.name, $version
      }
    } finally {
      Remove-Item -LiteralPath $listPath -Force -ErrorAction SilentlyContinue
    }
    return
  }

  if ([string]::IsNullOrWhiteSpace($PetId)) {
    Write-Host "Usage: Install-CodexPet <pet-slug--author-slug> [-Force]"
    Write-Host "List:  Install-CodexPet -List"
    throw "Missing pet id"
  }

  if ($PetId -notmatch "^[a-z0-9]+(-[a-z0-9]+)*--[a-z0-9]+(-[a-z0-9]+)*$") {
    throw "Invalid pet id: $PetId. Expected format: pet-slug--author-slug"
  }

  $tempRoot = Join-Path ([IO.Path]::GetTempPath()) ("codex-pet-" + [guid]::NewGuid().ToString("N"))
  $petsRoot = Join-Path $CodexHome "pets"
  $stageDir = $null
  $lockDir = $null
  $backupDir = $null
  New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

  try {
    $manifestPath = Join-Path $tempRoot "install-manifest.json"
    Download-CodexPetFile -Uri "$RawBase/install-manifest.json" -Destination $manifestPath -MaxBytes 1000000
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    if ($manifest.schemaVersion -ne 1 -or $null -eq $manifest.pets) {
      throw "Invalid install manifest schema"
    }
    $recordProperty = $manifest.pets.PSObject.Properties[$PetId]
    if ($null -eq $recordProperty) {
      throw "Pet not found in install manifest: $PetId"
    }
    $record = $recordProperty.Value
    $expectedPetJsonSha = [string]$record.petJsonSha256
    $expectedSpritesheetSha = [string]$record.spritesheetSha256
    if ($expectedPetJsonSha -notmatch "^[a-f0-9]{64}$" -or $expectedSpritesheetSha -notmatch "^[a-f0-9]{64}$") {
      throw "Invalid SHA-256 values in install manifest"
    }
    $expectedPetJsonBytes = [int64]$record.petJsonBytes
    $expectedSpritesheetBytes = [int64]$record.spritesheetBytes
    if ($expectedPetJsonBytes -lt 1 -or $expectedPetJsonBytes -gt 65536) {
      throw "Invalid pet.json size in install manifest"
    }
    if ($expectedSpritesheetBytes -lt 1 -or $expectedSpritesheetBytes -gt 5000000) {
      throw "Invalid spritesheet size in install manifest"
    }

    $downloadDir = Join-Path $tempRoot "download"
    New-Item -ItemType Directory -Path $downloadDir | Out-Null
    $petJsonPath = Join-Path $downloadDir "pet.json"
    $spritesheetPath = Join-Path $downloadDir "spritesheet.webp"
    Download-CodexPetFile -Uri "$RawBase/pets/$PetId/pet.json" -Destination $petJsonPath -MaxBytes 65536
    Download-CodexPetFile -Uri "$RawBase/pets/$PetId/spritesheet.webp" -Destination $spritesheetPath -MaxBytes 5000000

    $petJsonSize = (Get-Item -LiteralPath $petJsonPath -Force).Length
    $spritesheetSize = (Get-Item -LiteralPath $spritesheetPath -Force).Length
    if ($petJsonSize -ne $expectedPetJsonBytes) { throw "pet.json size does not match the install manifest" }
    if ($spritesheetSize -ne $expectedSpritesheetBytes) { throw "spritesheet.webp size does not match the install manifest" }
    if ((Get-Sha256 $petJsonPath) -ne $expectedPetJsonSha) { throw "pet.json failed SHA-256 verification" }
    if ((Get-Sha256 $spritesheetPath) -ne $expectedSpritesheetSha) { throw "spritesheet.webp failed SHA-256 verification" }
    Assert-Webp $spritesheetPath

    $petJson = Get-Content -LiteralPath $petJsonPath -Raw | ConvertFrom-Json
    if ($petJson.id -ne $PetId) { throw "pet.json id does not match the requested pet id" }
    if ($petJson.spritesheetPath -ne "spritesheet.webp") { throw "pet.json spritesheetPath must be spritesheet.webp" }

    Assert-NoReparsePoint -Path $petsRoot -Label "Codex pets directory"
    New-Item -ItemType Directory -Force -Path $petsRoot | Out-Null
    Assert-NoReparsePoint -Path $petsRoot -Label "Codex pets directory"
    $lockDir = Join-Path $petsRoot ".$PetId.lock"
    try {
      New-Item -ItemType Directory -Path $lockDir -ErrorAction Stop | Out-Null
    } catch {
      throw "Another installation is already updating $PetId"
    }

    $stageDir = Join-Path $petsRoot ".$PetId.tmp-$([guid]::NewGuid().ToString('N'))"
    New-Item -ItemType Directory -Path $stageDir -ErrorAction Stop | Out-Null
    Copy-Item -LiteralPath $petJsonPath -Destination (Join-Path $stageDir "pet.json") -Force -ErrorAction Stop
    Copy-Item -LiteralPath $spritesheetPath -Destination (Join-Path $stageDir "spritesheet.webp") -Force -ErrorAction Stop

    $targetDir = Join-Path $petsRoot $PetId
    $targetItem = Get-Item -LiteralPath $targetDir -Force -ErrorAction SilentlyContinue
    if ($null -ne $targetItem) {
      Assert-ManagedPetPackage $targetDir
      if (-not $Force) { throw "$PetId is already installed; rerun with -Force to replace it" }
      if (-not $targetItem.PSIsContainer) { throw "Existing pet target is not a directory" }
      $backupDir = Join-Path $petsRoot ".$PetId.backup-$([guid]::NewGuid().ToString('N'))"
      Move-Item -LiteralPath $targetDir -Destination $backupDir -ErrorAction Stop
    }

    try {
      Move-Item -LiteralPath $stageDir -Destination $targetDir -ErrorAction Stop
      $stageDir = $null
    } catch {
      if ($null -ne $backupDir -and (Test-Path -LiteralPath $backupDir) -and -not (Test-Path -LiteralPath $targetDir)) {
        Move-Item -LiteralPath $backupDir -Destination $targetDir -ErrorAction SilentlyContinue
      }
      throw
    }

    if ($null -ne $backupDir) {
      Remove-Item -LiteralPath $backupDir -Recurse -Force -ErrorAction Stop
      $backupDir = $null
    }
    $verb = if ($Force) { "Updated" } else { "Installed" }
    Write-Host "$verb $PetId to $targetDir"

    $statsDisabled = $NoStats -or $env:AWESOME_CODEX_PET_NO_STATS -eq "1"
    if (-not $statsDisabled) {
      $statsApi = $env:AWESOME_CODEX_PET_STATS_API
      if ([string]::IsNullOrWhiteSpace($statsApi)) { $statsApi = "https://api.codexpet.top" }
      try {
        $eventId = [guid]::NewGuid().ToString("N")
        Invoke-WebRequest -UseBasicParsing -Method Post -TimeoutSec 3 -Headers @{ "X-Event-ID" = $eventId } -Uri "$($statsApi.TrimEnd('/'))/track/install?slug=$PetId" | Out-Null
      } catch {
        Write-Warning "Installed successfully, but anonymous install statistics could not be reported: $($_.Exception.Message)"
      }
    }
  } finally {
    if ($null -ne $stageDir) { Remove-Item -LiteralPath $stageDir -Recurse -Force -ErrorAction SilentlyContinue }
    if ($null -ne $backupDir) { Remove-Item -LiteralPath $backupDir -Recurse -Force -ErrorAction SilentlyContinue }
    if ($null -ne $lockDir) { Remove-Item -LiteralPath $lockDir -Recurse -Force -ErrorAction SilentlyContinue }
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}

if ($args.Count -gt 0) {
  Install-CodexPet @args
}
