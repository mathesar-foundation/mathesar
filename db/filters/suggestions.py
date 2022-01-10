from frozendict import frozendict


def parameter_count(count):
    return frozendict({"id": "parameter_count", "count": count})


def parameter(index, suggestions):
    return frozendict({"id": "parameter", "index": index, "suggestions": suggestions})


def all_parameters(suggestions):
    return frozendict({"id": "all_parameters", "suggestions": suggestions})


def returns(suggestions):
    return frozendict({"id": "returns", "suggestions": suggestions})


boolean = frozendict({"id": "returns"})


comparable = frozendict({"id": "comparable"})


column = frozendict({"id": "column"})


array = frozendict({"id": "array"})


string_like = frozendict({"id": "string_like"})


uri = frozendict({"id": "uri"})
