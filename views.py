# mathesar/views.py
from django.http import HttpResponse

def home(request):
    return HttpResponse("Hello World! Django is running.")

def page_not_found(request, exception):
    return HttpResponse("404 Page Not Found", status=404)

