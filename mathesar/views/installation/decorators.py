import functools

from django.contrib.auth import get_user_model
from django.shortcuts import redirect
from django.urls import reverse


# We're currently only identifiying if an installation is complete based on
# if or not a superuser account is present


def installation_incomplete(view_function=None):
    @functools.wraps(view_function)
    def wrapper(request, *args, **kwargs):
        if get_user_model().objects.filter(is_superuser=True).exists():
            return redirect(reverse('home'))
        return view_function(request, *args, **kwargs)
    return wrapper


def installation_complete(view_function=None):
    @functools.wraps(view_function)
    def wrapper(request, *args, **kwargs):
        if get_user_model().objects.filter(is_superuser=True).exists():
            return view_function(request, *args, **kwargs)
        return redirect(reverse('complete_installation'))
    return wrapper
