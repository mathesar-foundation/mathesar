from django.urls import include, path

from config import urls as root_urls
from demo import views


urlpatterns = [
    path('api/demo/v0/load_data/', views.load_data, name='load_data'),
    path('api/demo/v0/data_exists/', views.data_exists, name='data_exists'),
    path('', include(root_urls)),
]
