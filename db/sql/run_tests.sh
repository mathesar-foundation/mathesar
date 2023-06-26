#!/bin/bash
for i in {1..50}; do
  pg_isready -U mathesar -d postgres && break || sleep 0.5
done

if [[ $BASH_SOURCE = */* ]]; then
    sql=${BASH_SOURCE%/*}/
else
    sql=./
fi

psql -q -U mathesar -d postgres -f "$sql"/test_startup.sql
pg_prove --runtests -U mathesar -d mathesar_testing "$@"
exit_code=$?
psql -q -U mathesar -d postgres -f "$sql"/test_shutdown.sql
exit $exit_code
