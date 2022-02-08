from enum import Enum

from db.functions import hints

from db.functions.operations.check_support import get_supported_db_functions
from mathesar.database.types import get_ma_types_mapped_to_hintsets
from mathesar.database.types import find_ma_type_by_hintset


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
        type=_get_filter_type(db_function_subclass),
        parameters=_get_filter_parameters(mathesar_type_hints, db_function_subclass),
    )


def _get_filter_parameters(mathesar_type_hints, db_function_subclass):
    """
    Describes filter parameters, but only if the filter has a defined parameter count.
    It is presumed that only operators will have an undefined parameter count, and
    describing their parameters is moot.
    """
    parameter_count = hints.get_parameter_count(db_function_subclass)
    if parameter_count:
        filter_params = []
        for parameter_index in range(parameter_count):
            mathesar_type = _get_parameter_mathesar_type(
                mathesar_type_hints=mathesar_type_hints,
                db_function_subclass=db_function_subclass,
                index=parameter_index,
            )
            filter_param = _make_filter_param(
                index=parameter_index,
                mathesar_type=mathesar_type,
            )
            filter_params.append(filter_param)
        return tuple(filter_params)
    else:
        return None


def _make_filter_param(index, mathesar_type):
    return dict(
        index=index,
        mathesar_type=mathesar_type
    )


def _get_parameter_mathesar_type(mathesar_type_hints, db_function_subclass, index):
    parameter_hints = hints.get_parameter_hints(index, db_function_subclass)
    parameter_mathesar_type = find_ma_type_by_hintset(mathesar_type_hints, parameter_hints)
    return parameter_mathesar_type


class FilterType(Enum):
    OPERATOR = "operator"
    REGULAR = "regular"


def _get_filter_type(db_function_subclass):
    is_operator = (
        db_function_subclass.id in ["and", "or", "not"]
        # Below assertion highlights that an operator will not have a parameter count declared.
        # I.e. an operator's parameter count is unbounded.
        and hints.get_parameter_count(db_function_subclass) is None
    )
    if is_operator:
        return FilterType.OPERATOR
    else:
        return FilterType.REGULAR
