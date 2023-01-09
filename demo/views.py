from django.contrib.auth.decorators import login_required
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from demo.install import load_datasets, customize_settings, check_datasets
from mathesar.database.base import create_mathesar_engine
from mathesar.state import reset_reflection


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


@login_required
@api_view(['GET'])
def data_exists(request):
    """Return JSON according to whether live demo data is loaded."""
    db_name = request.GET['database']
    engine = create_mathesar_engine(db_name)
    datasets_exist = check_datasets(engine)
    return Response({'datasets_exist': datasets_exist})
