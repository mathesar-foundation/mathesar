from django.urls import include, path
from rest_framework_nested import routers

from mathesar import views
from mathesar.api import viewsets

db_router = routers.DefaultRouter()

db_router.register(r'tables', viewsets.TableViewSet, basename='table')
db_router.register(r'schemas', viewsets.SchemaViewSet, basename='schema')
db_router.register(r'databases', viewsets.DatabaseViewSet, basename='database')
db_router.register(r'data_files', viewsets.DataFileViewSet, basename='data-file')
db_router.register(r'functions', viewsets.DBFunctionViewSet, basename='functions')
db_router.register(r'db_types', viewsets.DBTypeViewSet, basename='db_types')

table_router = routers.NestedSimpleRouter(db_router, r'tables', lookup='table')
table_router.register(r'records', viewsets.RecordViewSet, basename='table-record')
table_router.register(r'columns', viewsets.ColumnViewSet, basename='table-column')
table_router.register(r'constraints', viewsets.ConstraintViewSet, basename='table-constraint')

abstractions_router = routers.DefaultRouter()

urlpatterns = [
    path('api/db/v0/', include(db_router.urls)),
    path('api/db/v0/', include(table_router.urls)),
    path('api/abstractions/v0/', include(abstractions_router.urls)),

    # Specifying each route individually to facilitate redirection and data pre-rendering based on route
    path('', views.home, name="home"),
    path('<db_name>/', views.db_home, name="db_home"),
    path('<db_name>/schemas/', views.schemas, name="schemas"),
    path('<db_name>/<int:schema_id>/', views.schema_home, name="schema_home"),
]
