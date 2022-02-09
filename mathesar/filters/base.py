from db.functions import hints

from db.functions.operations.check_support import get_supported_db_functions
from mathesar.database.types import get_ma_types_mapped_to_hintsets
from mathesar.database.types import ma_types_that_satisfy_hintset


def get_available_filters(engine):
    available_db_functions = get_supported_db_functions(engine)
    db_functions_castable_to_filter = (
        db_function
        for db_function in available_db_functions
        if _is_db_function_subclass_castable_to_filter(db_function)
    )
    mathesar_type_hints = get_ma_types_mapped_to_hintsets(engine)
    filters = tuple(
        _filter_from_db_function(
            mathesar_type_hints,
            db_function_castable_to_filter
        )
        for db_function_castable_to_filter
        in db_functions_castable_to_filter
    )
    return filters


def _is_db_function_subclass_castable_to_filter(db_function_subclass):
    # Provisionary implementation; ideally would examine parameter and output
    # related hints.
    return hints.mathesar_filter in db_function_subclass.hints


def _filter_from_db_function(mathesar_type_hints, db_function_subclass):
    return dict(
        id=db_function_subclass.id,
        name=db_function_subclass.name,
        parameters=_get_filter_parameters(mathesar_type_hints, db_function_subclass),
    )


def _get_filter_parameters(mathesar_type_hints, db_function_subclass):
    """
    Describes filter parameters. Returns a sequence of dicts (one per parameter described)
    containing at least the index and MA type of parameter.
    """
    parameter_count = hints.get_parameter_count(db_function_subclass)
    if not parameter_count:
        raise Exception("Parameter count must be declared on a DbFunction with the mathesar_filter hint.")
    filter_params = []
    for parameter_index in range(parameter_count):
        mathesar_types = _get_parameter_mathesar_types(
            mathesar_type_hints=mathesar_type_hints,
            db_function_subclass=db_function_subclass,
            index=parameter_index,
        )
        filter_param = _make_filter_param(
            mathesar_types=mathesar_types,
        )
        filter_params.append(filter_param)
    return tuple(filter_params)


def _make_filter_param(mathesar_types):
    return dict(
        mathesar_types=mathesar_types
    )


def _get_parameter_mathesar_types(mathesar_type_hints, db_function_subclass, index):
    parameter_hints = hints.get_parameter_hints(index, db_function_subclass)
    parameter_mathesar_types = ma_types_that_satisfy_hintset(mathesar_type_hints, parameter_hints)
    return parameter_mathesar_types
