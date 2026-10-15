#!/usr/bin/env bash
# Print the build version.
#
# Releases restart at VERSION (1.0.0). Each later release increments the patch
# by 1: 1.0.0, then 1.0.1, then 1.0.2. When VERSION is newer than the latest
# published release, that file is the next version (1.1.0, 2.0.0).
#
# LAST_RELEASE_TAG, when set (including empty), skips the GitHub lookup so the
# script can be checked locally. Unset, it reads the newest non-draft release.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

file_base="$(tr -d '[:space:]' < "$ROOT/VERSION")"
if [[ ! "$file_base" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "ERROR: VERSION must be major.minor.patch (got '$file_base')" >&2
  exit 1
fi

version_gt() {
  local left="$1" right="$2"
  local IFS=.
  local -a l r
  read -r -a l <<< "$left"
  read -r -a r <<< "$right"
  local i ln rn
  for i in 0 1 2; do
    ln="${l[$i]:-0}"
    rn="${r[$i]:-0}"
    if (( ln > rn )); then
      return 0
    fi
    if (( ln < rn )); then
      return 1
    fi
  done
  return 1
}

core_of() {
  local tag="$1"
  if [[ "$tag" =~ ^v?([0-9]+)\.([0-9]+)\.([0-9]+)(-pr\.[0-9]+)?$ ]]; then
    printf '%s.%s.%s\n' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}" "${BASH_REMATCH[3]}"
    return 0
  fi
  return 1
}

bump_patch() {
  local version="$1"
  if [[ "$version" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    printf '%s.%s.%s\n' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}" "$((BASH_REMATCH[3] + 1))"
    return 0
  fi
  return 1
}

tag=""
if [[ -n "${LAST_RELEASE_TAG+x}" ]]; then
  tag="$LAST_RELEASE_TAG"
elif [[ -n "${GH_TOKEN:-${GITHUB_TOKEN:-}}" ]]; then
  if [[ -n "${GITHUB_REPOSITORY:-}" ]]; then
    export GH_REPO="$GITHUB_REPOSITORY"
  fi
  tag="$(
    cd "$ROOT"
    gh release list --limit 20 --json tagName,isDraft \
      --jq '[.[] | select(.isDraft | not)][0].tagName // ""'
  )"
else
  echo "No GitHub token; using VERSION ($file_base) as the release line." >&2
fi

if [[ -z "$tag" ]]; then
  version="$file_base"
else
  if ! core="$(core_of "$tag")"; then
    echo "ERROR: latest release tag '$tag' is not major.minor.patch" >&2
    exit 1
  fi
  if version_gt "$file_base" "$core"; then
    version="$file_base"
  else
    version="$(bump_patch "$core")"
  fi
fi

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "version=$version"
    echo "base=$version"
  } >> "$GITHUB_OUTPUT"
fi

printf '%s\n' "$version"
