from mathesar.views import page_not_found
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
]
handler404 = 'mathesar.views.page_not_found'
