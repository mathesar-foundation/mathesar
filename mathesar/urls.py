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
table_router.register(r'constraints', api.ConstraintViewSet, basename='table-constraint')

urlpatterns = [
    path('', frontend.index, name="index"),
    path('api/v0/', include(router.urls)),
    path('api/v0/', include(table_router.urls)),
    # TODO: Handle known urls like /favicon.ico etc.,
    # Currently, this catches all
    re_path(r'(?P<dbname>\w+)/.*$', frontend.index, name="index"),
]
