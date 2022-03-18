from frozendict import frozendict


# Copied (and reordered) from table in
# https://www.postgresql.org/docs/11/datatype.html
canonical_to_aliases = frozendict(
    {
        'boolean': ['bool'],
        'bit varying': ['varbit'],
        'smallint': ['int2'],
        'integer': ['int', 'int4'],
        'bigint': ['int8'],
        'smallserial': ['serial2'],
        'serial': ['serial4'],
        'bigserial': ['serial8'],
        'real': ['float4'],
        'double precision': ['float8'],
        'numeric': ['decimal'],
        'character': ['char'],
        'character varying': ['varchar'],
        'time with timezone': ['timetz'],
        'timestamp with timezone': ['timestamptz'],
    }
)

alias_to_canonical = frozendict(
    {
        alias: canonical
        for canonical, aliases
        in canonical_to_aliases.items()
        for alias
        in aliases
    }
)
