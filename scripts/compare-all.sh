#!/usr/bin/env bash
# Runs scripts/compare-layout.ts for every migrated page and post at the given widths
# (one at a time; parallel runs exhaust Git Bash on Windows) and writes docs/compare/<slug>-<width>.txt plus docs/compare/summary.txt.
#
#   bash scripts/compare-all.sh 1440 390
#
# Needs `npm run dev` running on http://localhost:3000.
set -u
cd "$(dirname "$0")/.."
WIDTHS="${*:-1440 390}"
mkdir -p docs/compare
: > docs/compare/summary.txt

jobs_list=()
for f in src/content/pages/*.json src/content/posts/*.json; do
  path=$(node -e "console.log(require('./$f').path)")
  slug=$(basename "$f" .json)
  for w in $WIDTHS; do jobs_list+=("$path $w $slug"); done
done

printf '%s\n' "${jobs_list[@]}" | xargs -P 1 -L 1 bash -c '
  out="docs/compare/$2-$1.txt"
  MSYS_NO_PATHCONV=1 npx tsx scripts/compare-layout.ts "$0" "$1" > "$out" 2>&1
  tail -1 "$out" >> docs/compare/summary.txt
'
echo "done: $(wc -l < docs/compare/summary.txt) runs"
