from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import serializers

from demo.install import drop_all_stale_databases, load_datasets, customize_settings, check_datasets
from mathesar.database.base import create_mathesar_engine
from mathesar.state import reset_reflection
from mathesar.views import SchemasView as RootSchemasView


@login_required
@api_view(['POST'])
def load_data(request):
    """Load demo data sets, dropping and recreating them if they already exist."""
    db_name = request.GET['database']
    engine = create_mathesar_engine(db_name)
    load_datasets(engine)
    reset_reflection()
    customize_settings(engine)
    return Response(status=status.HTTP_200_OK)


class StaleDbRequestSerializer(serializers.Serializer):
    force = serializers.BooleanField(default=False)
    max_days = serializers.IntegerField(default=3)


@login_required
@api_view(['GET'])
def data_exists(request):
    """Return JSON according to whether live demo data is loaded."""
    db_name = request.GET['database']
    engine = create_mathesar_engine(db_name)
    datasets_exist = check_datasets(engine)
    return Response({'datasets_exist': datasets_exist})


@login_required
@staff_member_required
@api_view(['GET'])
def remove_stale_db(request):
    """Remove databases older than MAX_DAYS"""
    serializer = StaleDbRequestSerializer(data=request.data)
    if serializer.is_valid(True):
        deleted_databases = drop_all_stale_databases(
            force=serializer.validated_data['force'],
            max_days=serializer.validated_data['max_days']
        )
        return Response(
            {'deleted_databases': deleted_databases},
            status=status.HTTP_200_OK
        )


class SchemasView(RootSchemasView):
    """Exteded to add info about demo data sets."""
    def _get_common_data(self):
        common_data = super()._get_common_data()
        return common_data | {"datasets_exist": data_exists(self.request).data['datasets_exist']}
