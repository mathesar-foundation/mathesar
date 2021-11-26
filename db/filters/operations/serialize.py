from db.filters.base import Predicate, Leaf, SingleParameter, MultiParameter, NoParameter, Branch

def getSAFilterSpecFromPredicate(pred: Predicate) -> dict:
    if isinstance(pred, Leaf):
        if isinstance(pred, SingleParameter):
            return {'column': pred.column, 'op': pred.saId(), 'value': pred.parameter}
        elif isinstance(pred, MultiParameter):
            return {'column': pred.column, 'op': pred.saId(), 'value': pred.parameters}
        elif isinstance(pred, NoParameter):
            return {'column': pred.column, 'op': pred.saId()}
        else:
            raise Exception("This should never happen.")
    elif isinstance(pred, Branch):
        if isinstance(pred, SingleParameter):
            subject = getSAFilterSpecFromPredicate(pred.parameter)
            return {pred.saId(): [subject]}
        elif isinstance(pred, MultiParameter):
            subjects = [ getSAFilterSpecFromPredicate(subject) for subject in pred.parameters ]
            return {pred.saId(): subjects}
        else:
            raise Exception("This should never happen.")
    else:
        raise Exception("This should never happen.")
