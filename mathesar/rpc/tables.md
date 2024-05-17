What should be in the response for `tables.get`

- id
- name
- schema
- description

```
SELECT relname, relnamespace, pgn.nspname FROM pg_catalog.pg_class pgc LEFT JOIN pg_namespace pgn ON pgc.relnamespace=pgn.oid WHERE pgn.nspname != 'pg_toast' AND pgn.nspname != 'pg_catalog' AND pgn.nspname != 'information_schema' AND pgn.nspname != '__msar' AND pgn.nspname != 'msar' AND pgn.nspname != 'mathesar_types' AND pgc.relkind = 'r';
```
```
SELECT pgc.relname, pgc.relnamespace, pgn.nspname 
FROM pg_catalog.pg_class AS pgc 
LEFT JOIN pg_namespace AS pgn ON pgc.relnamespace = pgn.oid 
WHERE pgn.nspname NOT IN ('pg_toast', 'pg_catalog', 'information_schema', '__msar', 'msar', 'mathesar_types') 
AND pgc.relkind = 'r';
```
select * from pg_depend as pgd left join pg_class as pgc on pgc.oid = pgd.classid LEFT JOIN pg_namespace AS pgn ON pgc.relnamespace = pgn.oid WHERE pgn.nspname NOT IN ('pg_toast', 'pg_catalog', 'information_schema', '__msar', 'msar', 'mathesar_types') 
AND pgc.relkind = 'r' AND deptype = 'n';