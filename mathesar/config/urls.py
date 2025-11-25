from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('mathesar.urls')),  # make sure mathesar/urls.py exists
]

handler404 = 'mathesar.views.page_not_found'
