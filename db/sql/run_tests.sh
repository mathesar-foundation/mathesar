#!/bin/bash
for i in {1..50}; do
  pg_isready -U mathesar -d postgres && break || sleep 0.5
done

if [[ $BASH_SOURCE = */* ]]; then
    sql=${BASH_SOURCE%/*}/
else
    sql=./
fi
sleep 1  # It seems the socket might take a bit longer to appear
psql -q -U mathesar -d postgres -f "$sql"/test_startup.sql
for i in {1..50}; do
  pg_isready -U mathesar -d mathesar_testing && break || sleep 0.5
done
pg_prove --runtests -U mathesar -d mathesar_testing "$@"
exit_code=$?
psql -q -U mathesar -d postgres -f "$sql"/test_shutdown.sql
exit $exit_code
