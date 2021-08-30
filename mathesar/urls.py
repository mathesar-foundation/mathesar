from django.urls import include, path
from rest_framework_nested import routers

from mathesar.views import api, frontend


router = routers.DefaultRouter()
router.register(r'tables', api.TableViewSet, basename='table')
router.register(r'schemas', api.SchemaViewSet, basename='schema')
router.register(r'databases', api.DatabaseViewSet, basename='database')
router.register(r'data_files', api.DataFileViewSet, basename='data-file')

table_router = routers.NestedSimpleRouter(router, r'tables', lookup='table')
table_router.register(r'records', api.RecordViewSet, basename='table-record')
table_router.register(r'columns', api.ColumnViewSet, basename='table-column')
table_router.register(r'constraints', api.ConstraintViewSet, basename='table-constraint')

urlpatterns = [
    path('api/v0/', include(router.urls)),
    path('api/v0/', include(table_router.urls)),

    # Specifying each route individually to facilitate redirection and data pre-rendering based on route
    path('', frontend.home, name="home"),
    path('<db_name>/', frontend.db_home, name="db_home"),
    path('<db_name>/schemas/', frontend.schemas, name="schemas"),
    path('<db_name>/<int:schema_id>/', frontend.schema_home, name="schema_home"),
]
