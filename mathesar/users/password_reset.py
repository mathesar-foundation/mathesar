from django.contrib.auth.forms import SetPasswordForm
from django.contrib.auth.views import PasswordResetConfirmView
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.debug import sensitive_post_parameters
from django.utils.translation import gettext_lazy as _


class MathesarSetPasswordForm(SetPasswordForm):
    def save(self, commit=True):
        password = self.cleaned_data["new_password1"]
        self.user.set_password(password)
        # Default password is replaced with a password is set by the user, so change the status
        self.user.password_change_needed = False
        if commit:
            self.user.save()
        return self.user


class MathesarPasswordResetConfirmView(PasswordResetConfirmView):
    form_class = MathesarSetPasswordForm
    template_name = 'users/password_reset_confirmation.html'
    title = _('Change Default Password')

    @method_decorator(sensitive_post_parameters())
    @method_decorator(never_cache)
    def dispatch(self, *args, **kwargs):
        self.user = self.request.user
        self.validlink = True
        return super(PasswordResetConfirmView, self).dispatch(*args, **kwargs)

    def form_valid(self, form):
        form.save()
        return super(PasswordResetConfirmView, self).form_valid(form)
