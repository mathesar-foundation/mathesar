from django.urls import path, re_path

from mathesar import views

urlpatterns = [
    path('<db_name>/', views.SchemasView.as_view(), name='schemas'),
    re_path(
        r'^(?P<db_name>\w+)/(?P<schema_id>\w+)/',
        views.SchemasView.as_view(),
        name='schema_home'
    )
]
