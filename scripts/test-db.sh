#!/usr/bin/env bash
# Teste la migration et les règles côté serveur sur une base PostgreSQL locale.
# Prérequis : un PostgreSQL accessible (variables PG* standard), ex. :
#   PGHOST=localhost PGUSER=postgres ./scripts/test-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB=${TEST_DB:-vigie_test}
psql -q -X -c "drop database if exists $DB" -c "create database $DB"
psql -q -X -d "$DB" -v ON_ERROR_STOP=1 \
  -f supabase/tests/00_supabase_stub.sql \
  -f supabase/migrations/20261109000000_schema.sql \
  -f supabase/seed.sql
psql -q -X -d "$DB" -f supabase/tests/10_comportement.sql
