import functools

from django.contrib.auth import get_user_model
from django.shortcuts import redirect
from django.urls import reverse


def superuser_must_not_exists(view_function=None):
    """
    Decorator for views that redirects to the home page if at least one superuser exists
    """
    @functools.wraps(view_function)
    def wrapper(request, *args, **kwargs):
        if get_user_model().objects.filter(is_superuser=True).exists():
            return redirect(reverse('home'))
        return view_function(request, *args, **kwargs)
    return wrapper


def superuser_exists(view_function=None):
    """
    Decorator for views that checks if at least one superuser exists
    and redirects to the superuser create screen if none exists
    """
    @functools.wraps(view_function)
    def wrapper(request, *args, **kwargs):
        if get_user_model().objects.filter(is_superuser=True).exists():
            return view_function(request, *args, **kwargs)
        return redirect(reverse('superuser_create'))
    return wrapper
