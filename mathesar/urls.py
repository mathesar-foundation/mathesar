from django.contrib.auth.views import LoginView
from django.urls import include, path, re_path
from rest_framework_nested import routers

from mathesar import views
from mathesar.api.db import viewsets as db_viewsets
from mathesar.api.ui import viewsets as ui_viewsets
from mathesar.users.decorators import superuser_exist, superuser_must_not_exist
from mathesar.users.password_reset import MathesarPasswordResetConfirmView
from mathesar.users.superuser_create import SuperuserFormView

db_router = routers.DefaultRouter()
db_router.register(r'tables', db_viewsets.TableViewSet, basename='table')
db_router.register(r'queries', db_viewsets.QueryViewSet, basename='query')
db_router.register(r'links', db_viewsets.LinkViewSet, basename='links')
db_router.register(r'schemas', db_viewsets.SchemaViewSet, basename='schema')
db_router.register(r'data_files', db_viewsets.DataFileViewSet, basename='data-file')

db_table_router = routers.NestedSimpleRouter(db_router, r'tables', lookup='table')
db_table_router.register(r'records', db_viewsets.RecordViewSet, basename='table-record')
db_table_router.register(r'settings', db_viewsets.TableSettingsViewSet, basename='table-setting')
db_table_router.register(r'columns', db_viewsets.ColumnViewSet, basename='table-column')
db_table_router.register(r'constraints', db_viewsets.ConstraintViewSet, basename='table-constraint')

ui_router = routers.DefaultRouter()
ui_router.register(r'version', ui_viewsets.VersionViewSet, basename='version')
ui_router.register(r'users', ui_viewsets.UserViewSet, basename='user')
ui_router.register(r'database_roles', ui_viewsets.DatabaseRoleViewSet, basename='database_role')
ui_router.register(r'schema_roles', ui_viewsets.SchemaRoleViewSet, basename='schema_role')

ui_table_router = routers.NestedSimpleRouter(db_router, r'tables', lookup='table')
ui_table_router.register(r'records', ui_viewsets.RecordViewSet, basename='table-record')

# Shares
ui_router.register(r'tables/(?P<table_pk>[^/.]+)/shares', ui_viewsets.SharedTableViewSet, basename='shared-table')
ui_router.register(r'queries/(?P<query_pk>[^/.]+)/shares', ui_viewsets.SharedQueryViewSet, basename='shared-query')

urlpatterns = [
    path('api/rpc/v0/', views.MathesarRPCEntryPoint.as_view()),
    path('api/db/v0/', include(db_router.urls)),
    path('api/db/v0/', include(db_table_router.urls)),
    path('api/ui/v0/', include(ui_router.urls)),
    path('api/ui/v0/', include(ui_table_router.urls)),
    path('api/ui/v0/reflect/', views.reflect_all, name='reflect_all'),
    path('auth/password_reset_confirm', MathesarPasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('auth/login/', superuser_exist(LoginView.as_view(redirect_authenticated_user=True)), name='login'),
    path('auth/create_superuser/', superuser_must_not_exist(SuperuserFormView.as_view()), name='superuser_create'),
    path('auth/', include('django.contrib.auth.urls')),
    path('', views.home, name='home'),
    path('profile/', views.profile, name='profile'),
    path('administration/', views.admin_home, name='admin_home'),
    path('administration/users/', views.admin_home, name='admin_users_home'),
    path('administration/users/<int:user_id>/', views.admin_home, name='admin_users_edit'),
    path('administration/update/', views.admin_home, name='admin_update'),
    path('shares/tables/<slug>/', views.shared_table, name='shared_table'),
    path('shares/explorations/<slug>/', views.shared_query, name='shared_query'),
    path('databases/', views.databases, name='databases'),
    path('i18n/', include('django.conf.urls.i18n')),
    re_path(
        r'^db/(?P<database_id>\d+)/schemas/(?P<schema_id>\d+)/',
        views.schemas_home,
        name='schema_home'
    ),
    re_path(
        r'^db/(?P<database_id>\d+)/((schemas|settings)/)?',
        views.schemas,
        name='schemas'
    ),
]
