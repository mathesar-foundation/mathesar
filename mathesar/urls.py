from django.urls import path

from mathesar import views

urlpatterns = [
    path("", views.index, name="index"),
    path("collections/<int:pk>/", views.collection_detail, name="collection-detail"),
]
