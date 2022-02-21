from db.functions.operations.deserialize import get_raw_spec_components
from db.functions.exceptions import ReferencedColumnsDontExist


def rewrite_db_function_spec_column_ids_to_names(column_ids_to_names, spec):
    """
    Takes a DB function spec, looks for columns referenced via Django IDs (e.g. `{"column_id": 3}`)
    and replaces those with column names. That's necessary since the DB module is unaware of column
    IDs and can only accept columns referenced by name.
    """
    # Using a private method to do the heavy lifting since it uses different parameters.
    return _rewrite(
        column_ids_to_names=column_ids_to_names,
        spec_or_literal=spec
    )


def _rewrite(column_ids_to_names, spec_or_literal):
    its_a_spec = isinstance(spec_or_literal, dict)
    if its_a_spec:
        spec = spec_or_literal
        db_function_id, parameters = get_raw_spec_components(spec)
        if db_function_id == "column_id":
            db_function_id = "column_name"
            column_id = parameters[0]
            column_name = column_ids_to_names[column_id]
            if column_name:
                parameters[0] = column_name
            else:
                raise ReferencedColumnsDontExist(
                    f"Column ID {column_id} unknown."
                    + f" Known id-name mapping: {column_ids_to_names}"
                )
        parameters = [
            _rewrite(
                column_ids_to_names=column_ids_to_names,
                spec_or_literal=parameter,
            )
            for parameter in parameters
        ]
        return {db_function_id: parameters}
    else:
        literal = spec_or_literal
        return literal
