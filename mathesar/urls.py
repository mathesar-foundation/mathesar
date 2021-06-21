from django.urls import include, path
from rest_framework_nested import routers

from mathesar.views import api, frontend


router = routers.DefaultRouter()
router.register(r'tables', api.TableViewSet, basename='table')
router.register(r'schemas', api.SchemaViewSet, basename='schema')
router.register(r'database_keys', api.DatabaseKeyViewSet, basename='database_keys')
router.register(r'data_files', api.DataFileViewSet)

records_router = routers.NestedSimpleRouter(router, r'tables', lookup='table')
records_router.register(r'records', api.RecordViewSet, basename='table-records')

urlpatterns = [
    path('', frontend.index, name="index"),
    path('api/v0/', include(router.urls)),
    path('api/v0/', include(records_router.urls)),
    # TODO: Handle known urls like /favicon.ico etc.,
    # Currenty, this catches all
    path('<dbname>', frontend.index, name="index"),
]
