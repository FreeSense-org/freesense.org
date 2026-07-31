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
      jq -e --arg channel "${channel}" \
        '(.schema_version == "freesense.download/v1" or
          (.schema_version == "freesense.download/v2" and
           ([.artifacts[] | [.kind, .filesystem, .format]] | sort) as $artifacts |
           ([
             ["cloud", "ufs", "qcow2"],
             ["cloud", "ufs", "raw"],
             ["installer", null, "iso"]
           ] | sort) as $ufs_artifacts |
           ([
             ["cloud", "zfs", "qcow2"],
             ["cloud", "zfs", "raw"]
           ] | sort) as $zfs_artifacts |
           ($artifacts == $ufs_artifacts or
            $artifacts == ($ufs_artifacts + $zfs_artifacts | sort)))) and
         .channel == $channel' \
        "${work}/${channel}.canonical.json" >/dev/null || {
          echo "${channel} canonical document has an invalid schema or channel" >&2
          exit 1
        }
      diff <(jq -S . "${work}/${channel}.canonical.json") \
        <(jq -S . "${work}/${channel}.public.json") || {
          echo "${channel} website response differs from the canonical document" >&2
          exit 1
        }
      ;;
    404:404)
      jq -e --arg channel "${channel}" \
        '.error == ($channel + " release is not published")' \
        "${work}/${channel}.public.json" >/dev/null || {
        echo "${channel} website 404 is not the release Function response" >&2
        exit 1
      }
      ;;
    *)
      echo "${channel} release mismatch: canonical=${canonical_status}, website=${public_status}" >&2
      exit 1
      ;;
  esac
done
