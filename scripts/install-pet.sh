#!/usr/bin/env bash
set -euo pipefail

RAW_BASE="${AWESOME_CODEX_PET_RAW_BASE:-https://raw.githubusercontent.com/legeling/awesome-codex-pet/main}"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
STATS_API="${AWESOME_CODEX_PET_STATS_API:-https://api.codexpet.top}"
NO_STATS="${AWESOME_CODEX_PET_NO_STATS:-0}"
FORCE=0
PET_ID=""
LIST=0

usage() {
  cat <<'EOF'
Usage:
  curl -fsSL --proto '=https' --tlsv1.2 https://raw.githubusercontent.com/legeling/awesome-codex-pet/main/scripts/install-pet.sh | bash -s -- <pet-slug--author-slug>

Options:
  --codex-home <path>  Install into a custom Codex home directory
  --raw-base <url>     Use an explicit HTTPS repository ref
  --force              Replace an existing installation atomically
  --no-stats           Skip the anonymous install counter
  --list               List available pets
  --help               Show this help

Environment:
  CODEX_HOME                    Defaults to ~/.codex when unset
  AWESOME_CODEX_PET_RAW_BASE    Override the repository ref URL
  AWESOME_CODEX_PET_NO_STATS=1  Skip the anonymous install counter
EOF
}

fail() {
  echo "$1" >&2
  exit 1
}

need_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Missing required command: $1"
  fi
}

validate_raw_base() {
  case "$1" in
    https://*) ;;
    *) fail "The raw base URL must use HTTPS" ;;
  esac
}

download() {
  local url="$1"
  local destination="$2"
  local max_bytes="$3"
  curl -fsSL --proto '=https' --tlsv1.2 \
    --retry 2 --max-redirs 5 --connect-timeout 10 --max-time 120 \
    --max-filesize "$max_bytes" "$url" -o "$destination"
}

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
    return
  fi
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
    return
  fi
  if command -v openssl >/dev/null 2>&1; then
    openssl dgst -sha256 "$1" | awk '{print $NF}'
    return
  fi
  fail "A SHA-256 tool is required (sha256sum, shasum, or openssl)"
}

new_event_id() {
  if command -v uuidgen >/dev/null 2>&1; then
    uuidgen | tr '[:upper:]' '[:lower:]' | tr -d '-'
    return
  fi
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 16
    return
  fi
  printf '%s.%s.%s' "$(date +%s)" "$$" "${RANDOM:-0}"
}

list_pets() {
  need_command curl
  local catalog
  catalog="$(mktemp)"
  if ! download "$RAW_BASE/pets.json" "$catalog" 1000000; then
    rm -f "$catalog"
    return 1
  fi

  if command -v python3 >/dev/null 2>&1; then
    CATALOG_PATH="$catalog" python3 - <<'PY'
import json
import os

with open(os.environ["CATALOG_PATH"], encoding="utf-8") as handle:
    catalog = json.load(handle)
for pet in catalog:
    print(f"{pet['slug']} - {pet.get('name', pet['slug'])} (v{pet.get('spriteVersionNumber', 1)})")
PY
  else
    cat "$catalog"
  fi
  rm -f "$catalog"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --help|-h)
      usage
      exit 0
      ;;
    --list)
      LIST=1
      shift
      ;;
    --force)
      FORCE=1
      shift
      ;;
    --no-stats)
      NO_STATS=1
      shift
      ;;
    --codex-home|--raw-base)
      [ "$#" -ge 2 ] || fail "$1 requires a value"
      [ "$2" != "--" ] || fail "$1 requires a value"
      if [ "$1" = "--codex-home" ]; then
        CODEX_HOME="$2"
      else
        RAW_BASE="$2"
      fi
      shift 2
      ;;
    --)
      shift
      while [ "$#" -gt 0 ]; do
        [ -z "$PET_ID" ] || fail "Unexpected extra argument: $1"
        PET_ID="$1"
        shift
      done
      ;;
    --*)
      fail "Unknown option: $1"
      ;;
    *)
      [ -z "$PET_ID" ] || fail "Unexpected extra argument: $1"
      PET_ID="$1"
      shift
      ;;
  esac
done

validate_raw_base "$RAW_BASE"
RAW_BASE="${RAW_BASE%/}"

if [ "$LIST" = "1" ]; then
  [ -z "$PET_ID" ] || fail "--list cannot be combined with a pet id"
  list_pets
  exit 0
fi

[ -n "$PET_ID" ] || { usage; exit 1; }
if ! printf '%s' "$PET_ID" | grep -Eq '^[a-z0-9]+(-[a-z0-9]+)*--[a-z0-9]+(-[a-z0-9]+)*$'; then
  fail "Invalid pet id: $PET_ID. Expected format: pet-slug--author-slug"
fi

need_command curl
need_command mktemp
need_command awk
need_command sed
need_command od

TMP_DIR="$(mktemp -d)"
PETS_ROOT="$CODEX_HOME/pets"
STAGE_DIR=""
LOCK_DIR=""
BACKUP_DIR=""
cleanup() {
  [ -z "$STAGE_DIR" ] || rm -rf "$STAGE_DIR"
  [ -z "$LOCK_DIR" ] || rm -rf "$LOCK_DIR"
  [ -z "$BACKUP_DIR" ] || rm -rf "$BACKUP_DIR"
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

MANIFEST_PATH="$TMP_DIR/install-manifest.json"
download "$RAW_BASE/install-manifest.json" "$MANIFEST_PATH" 1000000

MANIFEST_RECORD="$(awk -v key="\"$PET_ID\"" '
  $0 ~ "^[[:space:]]*" key "[[:space:]]*:[[:space:]]*\\{" { inside=1; next }
  inside && /^[[:space:]]*}/ { exit }
  inside { print }
' "$MANIFEST_PATH")"
[ -n "$MANIFEST_RECORD" ] || fail "Pet not found in install manifest: $PET_ID"

manifest_field() {
  printf '%s\n' "$MANIFEST_RECORD" \
    | sed -nE "s/^[[:space:]]*\"$1\":[[:space:]]*\"?([^\",}]+)\"?,?[[:space:]]*$/\1/p" \
    | head -n 1
}

EXPECTED_PET_JSON_SHA="$(manifest_field petJsonSha256)"
EXPECTED_PET_JSON_BYTES="$(manifest_field petJsonBytes)"
EXPECTED_SPRITESHEET_SHA="$(manifest_field spritesheetSha256)"
EXPECTED_SPRITESHEET_BYTES="$(manifest_field spritesheetBytes)"

[[ "$EXPECTED_PET_JSON_SHA" =~ ^[0-9a-fA-F]{64}$ ]] || fail "Invalid pet.json hash in install manifest"
[[ "$EXPECTED_SPRITESHEET_SHA" =~ ^[0-9a-fA-F]{64}$ ]] || fail "Invalid spritesheet hash in install manifest"
[[ "$EXPECTED_PET_JSON_BYTES" =~ ^[1-9][0-9]*$ ]] || fail "Invalid pet.json size in install manifest"
[[ "$EXPECTED_SPRITESHEET_BYTES" =~ ^[1-9][0-9]*$ ]] || fail "Invalid spritesheet size in install manifest"
[ "$EXPECTED_PET_JSON_BYTES" -le 65536 ] || fail "Manifest pet.json size exceeds safety limit"
[ "$EXPECTED_SPRITESHEET_BYTES" -le 5000000 ] || fail "Manifest spritesheet size exceeds safety limit"

PET_JSON_PATH="$TMP_DIR/pet.json"
SPRITESHEET_PATH="$TMP_DIR/spritesheet.webp"
download "$RAW_BASE/pets/$PET_ID/pet.json" "$PET_JSON_PATH" 65536
download "$RAW_BASE/pets/$PET_ID/spritesheet.webp" "$SPRITESHEET_PATH" 5000000

[ "$(wc -c < "$PET_JSON_PATH" | tr -d '[:space:]')" = "$EXPECTED_PET_JSON_BYTES" ] \
  || fail "pet.json size does not match the install manifest"
[ "$(wc -c < "$SPRITESHEET_PATH" | tr -d '[:space:]')" = "$EXPECTED_SPRITESHEET_BYTES" ] \
  || fail "spritesheet.webp size does not match the install manifest"
PET_JSON_SHA="$(printf '%s' "$EXPECTED_PET_JSON_SHA" | tr '[:upper:]' '[:lower:]')"
SPRITESHEET_SHA="$(printf '%s' "$EXPECTED_SPRITESHEET_SHA" | tr '[:upper:]' '[:lower:]')"
[ "$(sha256_file "$PET_JSON_PATH")" = "$PET_JSON_SHA" ] \
  || fail "pet.json failed SHA-256 verification"
[ "$(sha256_file "$SPRITESHEET_PATH")" = "$SPRITESHEET_SHA" ] \
  || fail "spritesheet.webp failed SHA-256 verification"

grep -Eq '"id"[[:space:]]*:[[:space:]]*"'"$PET_ID"'"' "$PET_JSON_PATH" \
  || fail "pet.json id does not match the requested pet id"
grep -Eq '"spritesheetPath"[[:space:]]*:[[:space:]]*"spritesheet\.webp"' "$PET_JSON_PATH" \
  || fail "pet.json spritesheetPath must be spritesheet.webp"

RIFF_HEADER="$(od -An -t x1 -N 4 "$SPRITESHEET_PATH" | tr -d '[:space:]')"
WEBP_HEADER="$(od -An -t x1 -j 8 -N 4 "$SPRITESHEET_PATH" | tr -d '[:space:]')"
[ "$RIFF_HEADER" = "52494646" ] && [ "$WEBP_HEADER" = "57454250" ] \
  || fail "spritesheet.webp is not a WebP image"

if [ -L "$PETS_ROOT" ]; then
  fail "Codex pets directory must not be a symbolic link"
fi
mkdir -p "$PETS_ROOT"
[ ! -L "$PETS_ROOT" ] || fail "Codex pets directory must not be a symbolic link"
[ -d "$PETS_ROOT" ] || fail "Codex pets path is not a directory"

LOCK_DIR="$PETS_ROOT/.$PET_ID.lock"
mkdir "$LOCK_DIR" 2>/dev/null || fail "Another installation is already updating $PET_ID"
STAGE_DIR="$(mktemp -d "$PETS_ROOT/.$PET_ID.tmp.XXXXXX")"
cp "$PET_JSON_PATH" "$STAGE_DIR/pet.json"
cp "$SPRITESHEET_PATH" "$STAGE_DIR/spritesheet.webp"

TARGET_DIR="$PETS_ROOT/$PET_ID"
if [ -e "$TARGET_DIR" ] || [ -L "$TARGET_DIR" ]; then
  [ ! -L "$TARGET_DIR" ] || fail "Existing pet target must not be a symbolic link"
  [ -d "$TARGET_DIR" ] || fail "Existing pet target is not a directory"
  [ "$FORCE" = "1" ] || fail "$PET_ID is already installed; rerun with --force to replace it"
  if [ -n "$(find "$TARGET_DIR" -type l -print -quit)" ]; then
    fail "Existing pet package contains a symbolic link"
  fi
  UNMANAGED_ENTRY="$(find "$TARGET_DIR" -mindepth 1 -maxdepth 1 ! -name pet.json ! -name spritesheet.webp -print -quit)"
  [ -z "$UNMANAGED_ENTRY" ] || fail "Existing pet package contains an unmanaged file; refusing to replace it: $UNMANAGED_ENTRY"
  BACKUP_DIR="$PETS_ROOT/.$PET_ID.backup.$$"
  mv "$TARGET_DIR" "$BACKUP_DIR"
fi

if ! mv "$STAGE_DIR" "$TARGET_DIR"; then
  if [ -n "$BACKUP_DIR" ] && [ -e "$BACKUP_DIR" ] && [ ! -e "$TARGET_DIR" ]; then
    mv "$BACKUP_DIR" "$TARGET_DIR"
  fi
  fail "Could not activate the installed pet package"
fi
STAGE_DIR=""
if [ -n "$BACKUP_DIR" ]; then
  rm -rf "$BACKUP_DIR"
  BACKUP_DIR=""
fi
LOCK_DIR=""
rm -rf "$PETS_ROOT/.$PET_ID.lock"

if [ "$FORCE" = "1" ]; then
  echo "Updated $PET_ID to $TARGET_DIR"
else
  echo "Installed $PET_ID to $TARGET_DIR"
fi

if [ "$NO_STATS" != "1" ]; then
  EVENT_ID="$(new_event_id)"
  curl -fsS -m 3 --connect-timeout 3 -X POST \
    -H "X-Event-ID: $EVENT_ID" \
    "$STATS_API/track/install?slug=$PET_ID" >/dev/null 2>&1 || {
      printf 'Warning: installed successfully, but anonymous install statistics could not be reported.\n' >&2
    }
fi
