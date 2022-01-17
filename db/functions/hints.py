from frozendict import frozendict

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
