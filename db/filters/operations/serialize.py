from db.filters.base import Predicate, Leaf, SingleParameter, MultiParameter, NoParameter, Branch


def get_SA_filter_spec_from_predicate(pred: Predicate) -> dict:
    if isinstance(pred, Leaf):
        if isinstance(pred, SingleParameter):
            return {'field': pred.column, 'op': pred.saId(), 'value': pred.parameter}
        elif isinstance(pred, MultiParameter):
            return {'field': pred.column, 'op': pred.saId(), 'value': pred.parameters}
        elif isinstance(pred, NoParameter):
            return {'field': pred.column, 'op': pred.saId()}
        else:
            raise Exception("This should never happen.")
    elif isinstance(pred, Branch):
        if isinstance(pred, SingleParameter):
            subject = get_SA_filter_spec_from_predicate(pred.parameter)
            return {pred.saId(): [subject]}
        elif isinstance(pred, MultiParameter):
            subjects = [get_SA_filter_spec_from_predicate(subject) for subject in pred.parameters]
            return {pred.saId(): subjects}
        else:
            raise Exception("This should never happen.")
    else:
        raise Exception("This should never happen.")
