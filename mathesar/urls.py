from django.urls import include, path
from rest_framework_nested import routers

from mathesar import views
from mathesar.api import legacy_viewsets
from mathesar.api.viewsets.data_files import DataFileViewSet
from mathesar.api.viewsets.schemas import SchemaViewSet
from mathesar.api.viewsets.tables import TableViewSet


router = routers.DefaultRouter()
router.register(r'tables', TableViewSet, basename='table')
router.register(r'schemas', SchemaViewSet, basename='schema')
router.register(r'databases', legacy_viewsets.DatabaseViewSet, basename='database')
router.register(r'data_files', DataFileViewSet, basename='data-file')

table_router = routers.NestedSimpleRouter(router, r'tables', lookup='table')
table_router.register(r'records', legacy_viewsets.RecordViewSet, basename='table-record')
table_router.register(r'columns', legacy_viewsets.ColumnViewSet, basename='table-column')
table_router.register(r'constraints', legacy_viewsets.ConstraintViewSet, basename='table-constraint')

urlpatterns = [
    path('api/v0/', include(router.urls)),
    path('api/v0/', include(table_router.urls)),

    # Specifying each route individually to facilitate redirection and data pre-rendering based on route
    path('', views.home, name="home"),
    path('<db_name>/', views.db_home, name="db_home"),
    path('<db_name>/schemas/', views.schemas, name="schemas"),
    path('<db_name>/<int:schema_id>/', views.schema_home, name="schema_home"),
]
