from django.urls import include, path, re_path

from config import urls as root_urls
from demo import views


urlpatterns = [
    path('api/demo/v0/load_data/', views.load_data, name='load_data'),
    path('api/demo/v0/datasets_exist/', views.data_exists, name='datasets_exist'),
    path('<db_name>/', views.SchemasView.as_view(), name='schemas'),
    re_path(
        r'^(?P<db_name>\w+)/(?P<schema_id>\w+)/',
        views.SchemasView.as_view(),
        name='schema_home'
    ),
    path('', include(root_urls)),
]
