from django.contrib.auth.views import LoginView
from django.urls import include, path, re_path
from rest_framework import routers

from mathesar import views
from mathesar.api.viewsets.data_files import DataFileViewSet
from mathesar.api.viewsets.bulk_insert import BulkInsertViewSet
from mathesar.views.installation.decorators import installation_complete, installation_incomplete
from mathesar.views.installation.complete_installation import CompleteInstallationFormView
from mathesar.views.users.password_reset import MathesarPasswordResetConfirmView

db_router = routers.DefaultRouter()
db_router.register(r'data_files', DataFileViewSet, basename='data-file')
db_router.register(r'bulk_insert', BulkInsertViewSet, basename='bulk-insert')

urlpatterns = [
    path('api/rpc/v0/', views.MathesarRPCEntryPoint.as_view()),
    path('api/db/v0/', include(db_router.urls)),
    path('api/export/v0/explorations/', views.export.export_exploration, name='export_exploration'),
    path('api/export/v0/tables/', views.export.export_table, name='export_table'),
    path('complete_installation/', installation_incomplete(CompleteInstallationFormView.as_view()), name='complete_installation'),
    path('auth/password_reset_confirm/', MathesarPasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('auth/login/', installation_complete(LoginView.as_view(redirect_authenticated_user=True)), name='login'),
    path('auth/3rdparty/<path:rest>/', installation_complete(LoginView.as_view(redirect_authenticated_user=True)), name='oidc'),  # hack to redirect '/login/cancelled', 'login/error/' 'signup/' and '' to login page
    path('auth/', include('django.contrib.auth.urls')),  # default auth/
    path('auth/', include('allauth.urls')),  # catch any urls that are not available in default auth/
    path('', views.home, name='home'),
    path('profile/', views.profile, name='profile'),
    path('administration/', views.admin_home, name='admin_home'),
    path('administration/users/', views.admin_home, name='admin_users_home'),
    path('administration/users/new/', views.admin_home, name='admin_users_new'),
    path('administration/users/<int:user_id>/', views.admin_home, name='admin_users_edit'),
    path('administration/update/', views.admin_home, name='admin_update'),
    path('administration/settings/', views.admin_home, name='admin_settings'),
    path('files/<slug:download_link_mash>/download/', views.download_link.download_file, name='files_download'),
    path('files/<slug:download_link_mash>/thumbnail/', views.download_link.load_file_thumbnail, name='files_thumbnail'),
    path('files/<slug:download_link_mash>/', views.download_link.load_file, name='files_direct'),
    path('files/', views.download_link.upload_file, name='files_upload'),
    path('i18n/', include('django.conf.urls.i18n')),
    path('info/analytics_sample_report/', views.analytics_sample_report, name='analytics_sample_report'),
    re_path(r'^shares/forms/(?P<form_token>[0-9a-zA-Z\-]+)/?', views.anonymous_route_home, name='shared_form'),
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
