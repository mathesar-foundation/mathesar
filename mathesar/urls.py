from django.contrib.auth.views import LoginView
from django.urls import include, path, re_path
from rest_framework_nested import routers

from mathesar import views
from mathesar.api.db import viewsets as db_viewsets
from mathesar.api.ui import viewsets as ui_viewsets
from mathesar.users.password_reset import MathesarPasswordResetConfirmView

db_router = routers.DefaultRouter()
db_router.register(r'tables', db_viewsets.TableViewSet, basename='table')
db_router.register(r'queries', db_viewsets.QueryViewSet, basename='query')
db_router.register(r'links', db_viewsets.LinkViewSet, basename='links')
db_router.register(r'schemas', db_viewsets.SchemaViewSet, basename='schema')
db_router.register(r'databases', db_viewsets.DatabaseViewSet, basename='database')
db_router.register(r'data_files', db_viewsets.DataFileViewSet, basename='data-file')

db_table_router = routers.NestedSimpleRouter(db_router, r'tables', lookup='table')
db_table_router.register(r'records', db_viewsets.RecordViewSet, basename='table-record')
db_table_router.register(r'settings', db_viewsets.TableSettingsViewSet, basename='table-setting')
db_table_router.register(r'columns', db_viewsets.ColumnViewSet, basename='table-column')
db_table_router.register(r'constraints', db_viewsets.ConstraintViewSet, basename='table-constraint')

ui_router = routers.DefaultRouter()
ui_router.register(r'version', ui_viewsets.VersionViewSet, basename='version')
ui_router.register(r'databases', ui_viewsets.DatabaseViewSet, basename='database')
ui_router.register(r'users', ui_viewsets.UserViewSet, basename='user')
ui_router.register(r'database_roles', ui_viewsets.DatabaseRoleViewSet, basename='database_role')
ui_router.register(r'schema_roles', ui_viewsets.SchemaRoleViewSet, basename='schema_role')

ui_table_router = routers.NestedSimpleRouter(db_router, r'tables', lookup='table')
ui_table_router.register(r'records', ui_viewsets.RecordViewSet, basename='table-record')

urlpatterns = [
    path('api/db/v0/', include(db_router.urls)),
    path('api/db/v0/', include(db_table_router.urls)),
    path('api/ui/v0/', include(ui_router.urls)),
    path('api/ui/v0/', include(ui_table_router.urls)),
    path('api/ui/v0/reflect/', views.reflect_all, name='reflect_all'),
    path('auth/password_reset_confirm', MathesarPasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('auth/login/', LoginView.as_view(redirect_authenticated_user=True), name='login'),
    path('auth/', include('django.contrib.auth.urls')),
    path('', views.home, name='home'),
    path('profile/', views.profile, name='profile'),
    path('administration/', views.admin_home, name='admin_home'),
    path('administration/users/', views.admin_home, name='admin_users_home'),
    path('administration/users/<user_id>/', views.admin_home, name='admin_users_edit'),
    path('administration/update/', views.admin_home, name='admin_update'),
    path('db/', views.home, name='db_home'),
    path('db/<db_name>/', views.schemas, name='schemas'),
    re_path(
        r'^db/(?P<db_name>\w+)/(?P<schema_id>\w+)/',
        views.schema_home,
        name='schema_home'
    ),
]
