from sqlalchemy import PrimaryKeyConstraint, UniqueConstraint


def get_first_unique_constraint(table):
    constraint_list = list(table.constraints)
    for item in constraint_list:
        if type(item) == UniqueConstraint:
            return item


def assert_only_primary_key_present(table):
    constraint_list = list(table.constraints)
    assert len(constraint_list) == 1
    assert type(constraint_list[0]) == PrimaryKeyConstraint


def assert_primary_key_and_unique_present(table):
    constraint_list = list(table.constraints)
    assert len(constraint_list) == 2
    assert set([PrimaryKeyConstraint, UniqueConstraint]) == set([type(constraint) for constraint in table.constraints])
