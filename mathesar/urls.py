from django.urls import include, path, re_path
from rest_framework_nested import routers

from mathesar.views import api, frontend


router = routers.DefaultRouter()
router.register(r'tables', api.TableViewSet, basename='table')
router.register(r'schemas', api.SchemaViewSet, basename='schema')
router.register(r'database_keys', api.DatabaseKeyViewSet, basename='database-key')
router.register(r'databases', api.DatabaseViewSet, basename='database')
router.register(r'data_files', api.DataFileViewSet, basename='data-file')

table_router = routers.NestedSimpleRouter(router, r'tables', lookup='table')
table_router.register(r'records', api.RecordViewSet, basename='table-record')
table_router.register(r'columns', api.ColumnViewSet, basename='table-column')

urlpatterns = [
    path('api/v0/', include(router.urls)),
    path('api/v0/', include(table_router.urls)),

    # Specifying each route individually to facilitate redirection and data pre-rendering based on route
    path('', frontend.index, name="index"),
    path('<dbname>/', frontend.index, name="index"),
    path('<dbname>/schemas/', frontend.schemas, name="schemas"),
    path('<dbname>/<int:schema>/', frontend.index, name="index"),
]
