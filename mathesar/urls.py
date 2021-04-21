from django.urls import path

from mathesar import views

urlpatterns = [
    path("", views.index, name="index"),
    path(
        "tables/<int:pk>/",
        views.TableDetail.as_view(),
        name="table-detail",
    ),
]
