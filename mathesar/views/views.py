from django.http import HttpResponse

def home(request):
    return HttpResponse("Hello World!")

def page_not_found(request, exception):
    return HttpResponse("Page not found", status=404)
