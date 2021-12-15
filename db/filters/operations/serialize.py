from db.filters.base import Predicate, Leaf, SingleParameter, MultiParameter, NoParameter, Branch


def get_SA_filter_spec_from_predicate(pred: Predicate) -> dict:
    if isinstance(pred, Leaf):
        sa_spec = {'field': pred.column, 'op': pred.saId}
        sa_parameter = pred.sa_parameter
        if sa_parameter:
            sa_spec['value'] = sa_parameter
        return sa_spec
    elif isinstance(pred, Branch):
        sa_parameter = pred.sa_parameter
        # A branch predicate will always be parametrized (with another predicate)
        if sa_parameter is not None:
            sa_parameters = [get_SA_filter_spec_from_predicate(sub_pred) for sub_pred in sa_parameter]
            return {pred.saId: sa_parameters}
        else:
            raise Exception("This should never happen.")
    else:
        raise Exception("This should never happen.")
