#!/bin/bash
# $1 entry, $2 outdir
E=/opt/npm-tools/node_modules/esbuild/bin/esbuild
mkdir -p $2
$E "$1" --bundle --splitting --outdir=$2 --entry-names=app --chunk-names=chunk-[hash] --format=esm --jsx=automatic --loader:.js=jsx \
  --alias:@supabase/supabase-js=$(pwd)/stubs/supabase.js --alias:@sentry/react=$(pwd)/stubs/sentry.js \
  --alias:react=/opt/npm-tools/node_modules/react --alias:react-dom=/opt/npm-tools/node_modules/react-dom \
  --define:import.meta.env.PROD=true --define:import.meta.env.VITE_SUPABASE_URL='"https://vxbfihnhielqambosmkc.supabase.co"' --define:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY='"x"' \
  --define:process.env.NODE_ENV='"production"' --log-level=warning
