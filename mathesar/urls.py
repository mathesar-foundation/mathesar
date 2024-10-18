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
db_router.register(r'data_files', db_viewsets.DataFileViewSet, basename='data-file')

ui_router = routers.DefaultRouter()
ui_router.register(r'users', ui_viewsets.UserViewSet, basename='user')

urlpatterns = [
    path('api/rpc/v0/', views.MathesarRPCEntryPoint.as_view()),
    path('api/db/v0/', include(db_router.urls)),
    path('api/ui/v0/', include(ui_router.urls)),
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
    path('databases/', views.databases_list_route, name='databases_list_route'),
    path('i18n/', include('django.conf.urls.i18n')),
    re_path(
        r'^db/(?P<database_id>\d+)/schemas/(?P<schema_id>\d+)/',
        views.schema_route,
        name='schema_route'
    ),
    re_path(
        r'^db/(?P<database_id>\d+)/((schemas|settings)/)?',
        views.database_route,
        name='database_route'
    ),
]
