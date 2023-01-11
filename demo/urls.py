from django.urls import path, re_path

from config.urls import urls
from demo import views

demo_wildcard_urls = [
    path('<db_name>/', views.SchemasView.as_view(), name='schemas'),
    re_path(
        r'^(?P<db_name>\w+)/(?P<schema_id>\w+)/',
        views.SchemasView.as_view(),
        name='schema_home'
    )
]

# Ignore mathesar wildcard urls as we override it with the demo wildcard urls
urlpatterns = urls + [
    path('api/demo/v0/load_data/', views.load_data, name='load_data'),
    path('api/demo/v0/datasets_exist/', views.data_exists, name='datasets_exist'),
    path('api/demo/v0/delete_stale_db/', views.remove_stale_db, name='remove_stale_db'),

] + demo_wildcard_urls
