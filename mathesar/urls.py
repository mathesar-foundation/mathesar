from django.conf import settings
from django.contrib.auth.views import LoginView
from django.urls import include, path, re_path

from mathesar import views
from mathesar.views.installation.decorators import installation_complete, installation_incomplete
from mathesar.views.installation.complete_installation import CompleteInstallationFormView
from mathesar.views.users.password_reset import MathesarPasswordResetConfirmView


_is_managed_saas = settings.MATHESAR_DEPLOYMENT_TYPE == settings.DEPLOYMENT_TYPE_MANAGED_SAAS

if _is_managed_saas:
    # Managed-SaaS uses an SSO-only login page rendered from a dedicated
    # template. Sign-in is open as long as the deployment has been
    # provisioned, so the installation_complete decorator (which gates on
    # superuser presence) is not applied here.
    _login_view = LoginView.as_view(
        redirect_authenticated_user=True,
        template_name='registration/login_managed_saas.html',
    )
    _auth_routes = [
        path('auth/login/', _login_view, name='login'),
        path('auth/3rdparty/<path:rest>/', _login_view, name='oidc'),
    ]
else:
    # Self-hosted: gate the login routes on installation completion and
    # register the complete-installation form for the bootstrap flow.
    _login_view = installation_complete(LoginView.as_view(redirect_authenticated_user=True))
    _auth_routes = [
        path(
            'complete_installation/',
            installation_incomplete(CompleteInstallationFormView.as_view()),
            name='complete_installation',
        ),
        path('auth/login/', _login_view, name='login'),
        path('auth/3rdparty/<path:rest>/', _login_view, name='oidc'),
    ]

urlpatterns = [
    path('api/rpc/v0/', views.MathesarRPCEntryPoint.as_view()),
    path('api/db/v0/data_files/', views.data_files.list_or_create_data_file, name='list_or_create_data_file'),
    path('api/db/v0/data_files/<int:data_file_id>/', views.data_files.get_or_patch_data_file, name='get_or_patch_data_file'),
    path('api/export/v0/explorations/', views.export.export_exploration, name='export_exploration'),
    path('api/export/v0/tables/', views.export.export_table, name='export_table'),
    path('auth/password_reset_confirm/', MathesarPasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    *_auth_routes,
    path('auth/', include('django.contrib.auth.urls')),  # default auth/
    path('auth/', include('allauth.urls')),  # catch any urls that are not available in default auth/
    path('bulk_insert/', views.bulk_insert.bulk_insert, name='bulk_insert'),
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
