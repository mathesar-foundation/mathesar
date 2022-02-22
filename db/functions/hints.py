from frozendict import frozendict


def get_parameter_hints(index, db_function_subclass):
    """
    Returns the hints declared on the parameter at specified index. If explicit hints are not
    declared for that parameter, returns the hints declared for all parameters.
    """
    hints_for_all_parameters = None
    for hint in db_function_subclass.hints:
        if hint['id'] == "parameter" and hint['index'] == index:
            hints_for_parameter_at_index = hint['hints']
            return hints_for_parameter_at_index
        if hint['id'] == "all_parameters":
            hints_for_all_parameters = hint['hints']
    return hints_for_all_parameters


def get_parameter_count(db_function_subclass):
    for hint in db_function_subclass.hints:
        if hint['id'] == "parameter_count":
            return hint['count']
    return None


def _make_hint(id, **rest):
    return frozendict({"id": id, **rest})


def parameter_count(count):
    return _make_hint("parameter_count", count=count)


def parameter(index, *hints):
    return _make_hint("parameter", index=index, hints=hints)


def all_parameters(*hints):
    return _make_hint("all_parameters", hints=hints)


def returns(*hints):
    return _make_hint("returns", hints=hints)


boolean = _make_hint("boolean")


comparable = _make_hint("comparable")


column = _make_hint("column")


array = _make_hint("array")


string_like = _make_hint("string_like")


uri = _make_hint("uri")


email = _make_hint("email")


duration = _make_hint("duration")


time = _make_hint("time")


date = _make_hint("date")


literal = _make_hint("literal")


# Meant to mark a DBFunction for the filtering API to use.
mathesar_filter = _make_hint("mathesar_filter")


# A hint that all types are meant to satisfy.
any = _make_hint("any")
