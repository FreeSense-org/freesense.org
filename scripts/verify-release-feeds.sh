#!/usr/bin/env bash
set -euo pipefail

if (($# != 1)); then
  echo "usage: verify-release-feeds.sh WEBSITE_BASE_URL" >&2
  exit 2
fi

website=${1%/}
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

for channel in stable devel; do
  canonical="https://pkg.freesense.org/v1/releases/${channel}.json"
  public="${website}/releases/${channel}.json?verify=${GITHUB_RUN_ID:-local}-${channel}"
  canonical_status=$(curl --silent --show-error --location --max-time 30 \
    --output "${work}/${channel}.canonical.json" --write-out '%{http_code}' "${canonical}")
  public_status=$(curl --silent --show-error --location --max-time 30 \
    --dump-header "${work}/${channel}.headers" \
    --output "${work}/${channel}.public.json" --write-out '%{http_code}' "${public}")

  case "${canonical_status}:${public_status}" in
    200:200)
      grep -Eqi '^x-freesense-release-source: canonical\r?$' "${work}/${channel}.headers"
      jq -e --arg channel "${channel}" \
        '.schema_version == "freesense.download/v1" and .channel == $channel' \
        "${work}/${channel}.canonical.json" >/dev/null
      diff <(jq -S . "${work}/${channel}.canonical.json") \
        <(jq -S . "${work}/${channel}.public.json")
      ;;
    404:404)
      grep -Eqi '^x-freesense-release-source: not-published\r?$' "${work}/${channel}.headers"
      ;;
    *)
      echo "${channel} release mismatch: canonical=${canonical_status}, website=${public_status}" >&2
      exit 1
      ;;
  esac
done
