# Print all Mathesar functions to the console for easy grepping

docker exec -it mathesar_dev_db bash -c "PAGER=cat psql -U mathesar --pset footer=off -qAtz -c $'SELECT DISTINCT routine_schema || \'.\' || routine_name as f FROM information_schema.routines WHERE routine_schema IN (\'msar\', \'__msar\') ORDER BY f;'"

