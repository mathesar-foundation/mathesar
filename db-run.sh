#!/usr/bin/env bash
set -e

# Loads various settings that are used elsewhere in the script
# This should be called before any other functions
docker_setup_env() {
	declare -g DATABASE_ALREADY_EXISTS
	# look specifically for PG_VERSION, as it is expected in the DB dir
	if [ -s "$PGDATA/PG_VERSION" ]; then
		DATABASE_ALREADY_EXISTS='true'
	fi
}

docker_setup_env
# only run initialization on an empty data directory
if [ -z "$DATABASE_ALREADY_EXISTS" ]; then
  pg_createcluster -d "$PGDATA" -p 5432 -u "postgres" "$PG_MAJOR" mathesar
  # Create a temporary postgres server for setting password to the postgres user and for creating the default database
  pg_ctlcluster "$PG_MAJOR" mathesar start
  sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'mathesar';"
  sudo -u postgres psql -c "CREATE DATABASE mathesar_django;"
  pg_ctlcluster "$PG_MAJOR" mathesar stop
fi
pg_ctlcluster "$PG_MAJOR" mathesar start
