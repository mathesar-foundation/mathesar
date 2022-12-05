from frozendict import frozendict


def get_hints_with_id(db_function_subclass, id):
    return tuple(
        hint
        for hint in db_function_subclass.hints
        if is_hint_id_equal_to(hint, id)
    )


def is_hint_id_equal_to(hint, id):
    return hint.get("id") == id


def _make_hint(id, **rest):
    return frozendict({"id": id, **rest})


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


def parameter_count(count):
    return _make_hint("parameter_count", count=count)


def parameter(index, *hints):
    return _make_hint("parameter", index=index, hints=hints)


def all_parameters(*hints):
    return _make_hint("all_parameters", hints=hints)


def returns(*hints):
    return _make_hint("returns", hints=hints)


def get_parameter_type_hints(index, db_function_subclass):
    """
    Returns the output of get_parameter_hints filtered to only include hints that are applicable to
    types. Useful when comparing a parameter's hintset to a type's hintset. We do that when
    matching filters to UI/Mathesar types, for example.
    """
    parameter_hints = get_parameter_hints(index, db_function_subclass)
    parameter_type_hints = tuple(
        hint
        for hint in parameter_hints
        if _is_hint_applicable_to_types(hint)
    )
    return parameter_type_hints


def _is_hint_applicable_to_types(hint):
    """
    Checks that a hint doesn't have the `not_applicable_to_types` hintset.
    """
    hints_about_hints = hint.get("hints", None)
    if hints_about_hints:
        return not_applicable_to_types not in hints_about_hints
    else:
        return True


# When applied to a hint, meant to suggest that it doesn't describe type attributes.
# Useful when you want to find only the hints that describe a type (or not a type).
# For example, when checking if hints applied to a Mathesar/UI type are a superset of hints applied
# to a parameter, you are only interested in hints that describe type-related information (that
# might be applied to a type).
not_applicable_to_types = _make_hint("not_applicable_to_types")


boolean = _make_hint("boolean")


comparable = _make_hint("comparable")


column = _make_hint("column")


array = _make_hint("array")


numeric = _make_hint("numeric")


string_like = _make_hint("string_like")


uri = _make_hint("uri")


email = _make_hint("email")


duration = _make_hint("duration")


time = _make_hint("time")


date = _make_hint("date")


literal = _make_hint("literal")


json = _make_hint("json")


json_array = _make_hint("jsonlist")


json_object = _make_hint("map")


# Meant to mark a DBFunction for the filtering API to use.
mathesar_filter = _make_hint("mathesar_filter")


# A hint that all types are meant to satisfy.
any = _make_hint("any")


# Meant to mark a DBFunction as an aggregation.
aggregation = _make_hint("aggregation")


# When applied to a parameter, meant to suggest values for that parameter.
def suggested_values(values):
    return _make_hint("suggested_values", hints=(not_applicable_to_types,), values=values)


# This hints suggests that a type is a point in time
point_in_time = _make_hint("point_in_time")


# Specifies that under conditions suggested by the `when` hintset the passed `alias` should be
# used instead of the default name. Useful, for example, for filters that you want to have
# different display names depending on what it is operating on.
def use_this_alias_when(alias, *when):
    return _make_hint(
        "use_this_alias_when",
        alias=alias,
        when=when,
        hints=(not_applicable_to_types,),
    )
