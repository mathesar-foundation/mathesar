from django.urls import include, path
from rest_framework import routers

from mathesar.views import api, frontend


router = routers.DefaultRouter()
router.register(r'tables', api.TableViewSet)
router.register(r'schemas', api.SchemaViewSet)

urlpatterns = [
    path('', frontend.index, name="index"),
    path(
        'tables/<int:pk>/',
        frontend.TableDetail.as_view(),
        name='frontend-table-detail',
    ),
    path('api/v0/', include(router.urls)),
]
