from db.functions import hints

from db.functions.operations.check_support import get_supported_db_functions
from mathesar.database.types import get_ui_types_mapped_to_hintsets
from mathesar.database.types import ui_types_that_satisfy_hintset


def get_available_filters(engine):
    available_db_functions = get_supported_db_functions(engine)
    db_functions_castable_to_filter = tuple(
        db_function
        for db_function in available_db_functions
        if _is_db_function_subclass_castable_to_filter(db_function)
    )
    ui_type_hints = get_ui_types_mapped_to_hintsets()
    filters = tuple(
        _filter_from_db_function(
            ui_type_hints,
            db_function_castable_to_filter,
        )
        for db_function_castable_to_filter
        in db_functions_castable_to_filter
    )
    return filters


def _is_db_function_subclass_castable_to_filter(db_function_subclass):
    # Provisionary implementation; ideally would examine parameter and output
    # related hints.
    db_function_hints = db_function_subclass.hints
    if db_function_hints:
        return hints.mathesar_filter in db_function_hints
    else:
        return False


def _filter_from_db_function(ui_type_hints, db_function_subclass):
    aliases = _get_aliases(ui_type_hints, db_function_subclass)
    return dict(
        id=db_function_subclass.id,
        name=db_function_subclass.name,
        aliases=aliases,
        parameters=_get_filter_parameters(ui_type_hints, db_function_subclass),
    )


# TODO are aliases still possible? might make sense to get rid of aliases-related logic.
def _get_aliases(ui_type_hints, db_function_subclass):
    alias_hints = hints.get_hints_with_id(db_function_subclass, 'use_this_alias_when')
    aliases = tuple(
        _process_alias_hint(ui_type_hints, alias_hint)
        for alias_hint in alias_hints
    )
    return aliases


def _process_alias_hint(ui_type_hints, alias_hint):
    alias_name = alias_hint.get("alias")
    when_hintset = alias_hint.get("when")
    when_ui_types = ui_types_that_satisfy_hintset(
        ui_type_hints,
        when_hintset
    )
    return dict(
        alias=alias_name,
        ui_types=when_ui_types,
    )


def _get_filter_parameters(ui_type_hints, db_function_subclass):
    """
    Describes filter parameters. Returns a sequence of dicts (one per parameter described)
    containing at least the MA type of parameter at that index.
    """
    parameter_count = hints.get_parameter_count(db_function_subclass)
    if not parameter_count:
        raise Exception("Parameter count must be declared on a DbFunction with the mathesar_filter hint.")
    filter_params = []
    for parameter_index in range(parameter_count):
        ui_types = _get_parameter_ui_types(
            ui_type_hints=ui_type_hints,
            db_function_subclass=db_function_subclass,
            parameter_index=parameter_index,
        )
        suggested_values = _get_parameter_suggested_values(
            db_function_subclass=db_function_subclass,
            parameter_index=parameter_index,
        )
        filter_param = _make_filter_param(
            ui_types=ui_types,
            suggested_values=suggested_values,
        )
        filter_params.append(filter_param)
    return tuple(filter_params)


def _get_parameter_suggested_values(db_function_subclass, parameter_index):
    parameter_hints = hints.get_parameter_hints(parameter_index, db_function_subclass)
    for hint in parameter_hints:
        if hint['id'] == 'suggested_values':
            return hint['values']


def _make_filter_param(ui_types, suggested_values):
    filter_param = dict(ui_types=ui_types)
    if suggested_values:
        filter_param['suggested_values'] = suggested_values
    return filter_param


def _get_parameter_ui_types(ui_type_hints, db_function_subclass, parameter_index):
    parameter_type_hints = hints.get_parameter_type_hints(parameter_index, db_function_subclass)
    parameter_ui_types = ui_types_that_satisfy_hintset(
        ui_type_hints,
        parameter_type_hints
    )
    if len(parameter_ui_types) == 0:
        raise Exception(
            f"Hints of DB function {db_function_subclass.id}"
            + f" parameter at index {parameter_index} must match"
            + " at least one Mathesar type (it didn't)."
        )
    return parameter_ui_types
