from django.urls import include, path
from rest_framework_nested import routers

from mathesar import views
from mathesar.api import viewsets

router = routers.DefaultRouter()
router.register(r'tables', viewsets.TableViewSet, basename='table')
router.register(r'schemas', viewsets.SchemaViewSet, basename='schema')
router.register(r'databases', viewsets.DatabaseViewSet, basename='database')
router.register(r'data_files', viewsets.DataFileViewSet, basename='data-file')
router.register(r'functions', viewsets.DbFunctionViewSet, basename='functions')
router.register(r'db_types', viewsets.DbTypeViewSet, basename='db_types')

table_router = routers.NestedSimpleRouter(router, r'tables', lookup='table')
table_router.register(r'records', viewsets.RecordViewSet, basename='table-record')
table_router.register(r'columns', viewsets.ColumnViewSet, basename='table-column')
table_router.register(r'constraints', viewsets.ConstraintViewSet, basename='table-constraint')

urlpatterns = [
    path('api/v0/', include(router.urls)),
    path('api/v0/', include(table_router.urls)),

    # Specifying each route individually to facilitate redirection and data pre-rendering based on route
    path('', views.home, name="home"),
    path('<db_name>/', views.db_home, name="db_home"),
    path('<db_name>/schemas/', views.schemas, name="schemas"),
    path('<db_name>/<int:schema_id>/', views.schema_home, name="schema_home"),
]
