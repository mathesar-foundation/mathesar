from rest_framework import viewsets
from rest_framework.response import Response
from db.types.base import db_types_hinted, PostgresType, MathesarCustomType
from itertools import chain


class DbTypeViewSet(viewsets.ViewSet):
    def list(self, _):
        known_vanilla_types = (postgres_type for postgres_type in PostgresType)
        known_custom_types = (mathesar_custom_type for mathesar_custom_type in MathesarCustomType)
        known_db_types = chain(known_vanilla_types, known_custom_types)
        data = [
            {
                "id": db_type.value,
                "hints": db_types_hinted.get(db_type, None)
            } for db_type in known_db_types
        ]
        return Response(data)
