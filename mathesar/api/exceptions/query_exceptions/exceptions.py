class DeletedColumnAccess(Exception):
    def __init__(
            self,
            column_id
    ):
        self.column_id = column_id
