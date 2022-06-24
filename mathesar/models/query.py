from collections import namedtuple

from db.columns.base import MathesarColumn


class Query(BaseModel):
    name = models.CharField(
        max_length=128,
        unique=True,
        null=True,
        blank=True,
    )
    base_table = models.ForeignKey('Table', on_delete=models.CASCADE)

    # sequence of dicts
    initial_columns = models.JSONField()

    # sequence of dicts
    transformations = models.JSONField(
        null=True,
        blank=True,
    )

    # dict of column ids/aliases to display options
    display_options = models.JSONField()

    @cached_property
    def sa_relation(self):
        """
        A query describes a relation. This property is the result of parsing a query into a
        relation.
        """
        initial_relation = _get_initial_relation(self)
        transformed = _apply_transformations(initial_relation, self.transformations)
        return transformed

    @cached_property
    def sa_output_columns(self):
        """
        Sequence of SQLAlchemy columns representing the output columns of the relation described
        by this query.
        """
        regular_sa_columns = self.sa_relation.columns
        enriched_sa_columns = tuple(MathesarColumn.from_column(col) for col in regular_sa_columns)
        return enriched_sa_columns

    @cached_property
    def get_output_columns_described(self):
        """
        Returns columns' description to be returned verbatim by the `queries/[id]/columns` endpoint.
        """
        return tuple(
            {
                'name': None,
                'alias': sa_col.name,
                'type': sa_col.db_type.id,
                'type_options': sa_col.type_options,
                'display_options': self._get_display_options_for_sa_col(sa_col),
            }
            for sa_col
            in self.sa_output_columns
        )

    def _get_display_options_for_sa_col(self, sa_col):
        if self.display_options is not None:
            return self.display_options.get(sa_col.name)

    def get_records(self):
        pass

    @cached_property
    def sa_base_table(self):
        pass


class JoinParams(
        namedtuple(
            'JoinParams',
            ['left_table', 'right_table', 'left_column', 'right_column']
        )
    ):
    def flip(self):
        # TODO
        return self


def _apply_transformations(initial_relation, transformations):
    return initial_relation


def _get_initial_relation(query):

    nested_join = None
    sa_columns_to_select = []
    for initial_column in query.initial_columns:
        nested_join, sa_column_to_select = _process_initial_column(
            initial_column=initial_column,
            nested_join=nested_join,
            query=query,
        )
        sa_columns_to_select.append(sa_column_to_select)

    select_target = nested_join or query.sa_base_table
    stmt = select(*sa_columns_to_select).select_from(select_target)
    return stmt


def _process_initial_column(initial_column, nested_join, query):
    if _is_base_column(initial_column):
        base_sa_col_to_select = _get_sa_column_by_id(initial_column.id)
        return nested_join, base_sa_col_to_select
    else:
        fk_id_path = _get_fk_id_path(initial_column)

        jp_path = _fk_id_path_to_jp_path(fk_id_path, query.sa_base_table)

        nested_join, foreign_sa_col_to_select = _process_jp_path(
            jp_path=jp_path,
            nested_join=nested_join,
            target_sa_column=get_sa_column_by_id(_get_initial_column_id(initial_column))
        )
        return nested_join, foreign_sa_col_to_select


def _fk_id_path_to_jp_path(fk_id_path, sa_base_table):
    """
    Converts a path made up of foreign key ids, into a path made up of join parameters.
    """
    fk_model_path = tuple(
        _get_dj_constraint_model_by_id(fk_id)
        for fk_id
        in fk_id_path
    )
    disoriented_jp_path = tuple(
        # TODO impl conversion
        JoinParams(
            left_table=fk_model.native_table,
            right_table=fk_model.foreign_table,
            left_column=fk_model.native_column,
            right_column=fk_model.foreign_column,
        )
        for fk_model
        in fk_model_path
    )
    return _fix_jp_orientations(disoriented_jp_path, sa_base_table)


def _process_jp_path(jp_path, nested_join, target_sa_column):
    rightmost_table_alias = None
    for i, jp in enumerate(reversed(jp_path)):
        is_last_jp = i == 0
        if is_last_jp:
            rightmost_table_alias = jp.right_table.alias()
            right_table = rightmost_table_alias
        else:
            right_table = nested_join

        nested_join = join(
            jp.left_table, right_table,
            jp.left_column == jp.right_column
        )
    sa_col_to_select = _access_column_on_aliased_relation(
        rightmost_table_alias,
        target_sa_column,
    )
    return nested_join, sa_col_to_select


def _fix_jp_orientations(jp_path, sa_base_table):
    flipped_jp_path = []
    for i, jp in enumerate(jp_path):
        should_flip = False
        is_first_jp = i == 0
        if is_first_jp:
            if sa_base_table != jp.left_table:
                should_flip = True
        else:
            previous_jp = flipped_jp_path[i-1]
            well_oriented = previous_jp.right_table == jp.left_table
            if not well_oriented:
                should_flip = True
        if should_flip:
            processed_jp = jp.flip()
        else:
            processed_jp = jp
        flipped_jp_path.append(processed_jp)
    return tuple(flipped_jp_path)

def _access_column_on_aliased_relation(aliased_relation, sa_column):
    pass

def _get_dj_constraint_model_by_id(dj_id):
    pass

def _get_sa_column_by_id(dj_id):
    pass

def _get_fk_id_path(initial_column):
    return initial_column['fk_path']

def _get_initial_column_id(initial_column):
    return initial_column['id']

def _is_base_column(initial_column):
    return _get_fk_id_path(initial_column) is not None
