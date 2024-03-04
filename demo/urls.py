from django.contrib.auth.decorators import login_required
from django.urls import include, path, re_path
from django.views.generic import RedirectView
from rest_framework.decorators import api_view
from rest_framework.exceptions import PermissionDenied

from config import urls as root_urls


@login_required
@api_view(['POST'])
def permission_denied(_, *args, **kwargs):
    raise PermissionDenied()


urlpatterns = [
    re_path(r'^api/ui/v0/users/(?P<pk>[^/.]+)/password_reset/', permission_denied, name='password_reset'),
    path('api/ui/v0/users/password_change/', permission_denied, name='password_change'),
    path('auth/password_reset_confirm/', RedirectView.as_view(url='/'), name='password_reset'),
    path(r'health/', include('health_check.urls')),
    path('', include(root_urls)),
]
