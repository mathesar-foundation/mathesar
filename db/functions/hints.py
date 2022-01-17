from frozendict import frozendict

def make_hint(id, **rest):
    return frozendict({"id": id, **rest})

def parameter_count(count):
    return make_hint("parameter_count", count=count)


def parameter(index, *hints):
    return make_hint("parameter", index=index, hints=hints)


def all_parameters(*hints):
    return make_hint("all_parameters", hints=hints)


def returns(*hints):
    return make_hint("returns", hints=hints)


boolean = make_hint("boolean")


comparable = make_hint("comparable")


column = make_hint("column")


array = make_hint("array")


string_like = make_hint("string_like")


uri = make_hint("uri")
