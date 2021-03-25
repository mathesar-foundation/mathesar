from django.urls import path

from mathesar import views

urlpatterns = [
    path("", views.index, name="index"),
    path("collections/<uuid:uuid>/", views.collection_detail, name="collection-detail"),
]
