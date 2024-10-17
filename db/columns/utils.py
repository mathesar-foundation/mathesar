def get_column_obj_from_relation(relation, column):
    """
    This function can look for anything that's reasonably referred to as
    a column, such as MathesarColumns, SA Columns, or just a column name
    string in the given relation
    """
    try:
        column = find_column_by_name_in_relation(relation, column)
    except AttributeError:
        column = relation.columns[column.name]

    return column


# TODO deal with quotes; still better than the default
def find_column_by_name_in_relation(relation, col_name_string):
    """
    Because we may have to look for the column by a name with an
    inappropriate namespacing (i.e., there may be an errant table or
    schema attached), we iteratively peel any possible namespace off the
    front of the column name string at each call.
    """
    try:
        return relation.columns[col_name_string]
    except KeyError:
        col_name_split = col_name_string.split(sep='.', maxsplit=1)
        if len(col_name_split) <= 1:
            raise KeyError(col_name_string)
        else:
            return find_column_by_name_in_relation(relation, col_name_split[-1])


def get_primary_key_column_collection_from_relation(relation):
    """
    This logic is needed since some "relations" have a primary_key
    attribute that has a column attribute that is a ColumnCollection
    subtype, whereas some relations have a primary_key attribute that is
    itself a ColumnCollection subtype.

    If there is no primary key in the relation, we return NoneType
    """
    pkey = getattr(relation, 'primary_key', None)
    pk_cols = getattr(pkey, 'columns', pkey)
    return pk_cols
