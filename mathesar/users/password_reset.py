from django.contrib.auth import get_user_model
from django.contrib.auth.forms import SetPasswordForm, UserCreationForm
from django.contrib.auth.views import PasswordResetConfirmView
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.debug import sensitive_post_parameters
from django.utils.translation import gettext_lazy as _
from django.views.generic import FormView

User = get_user_model()


class MathesarSetPasswordForm(SetPasswordForm):
    def save(self, commit=True):
        password = self.cleaned_data["new_password1"]
        self.user.set_password(password)
        # Default password is replaced with a password which is set by the user, so change the status
        self.user.password_change_needed = False
        if commit:
            self.user.save()
        return self.user


class MathesarPasswordResetConfirmView(PasswordResetConfirmView):
    # Override default form as we need custom save behaviour
    form_class = MathesarSetPasswordForm
    template_name = 'users/password_reset_confirmation.html'
    title = _('Change Default Password')
    success_url = "/auth/login"

    @method_decorator(sensitive_post_parameters())
    @method_decorator(never_cache)
    def dispatch(self, *args, **kwargs):
        self.user = self.request.user
        self.validlink = True
        # Avoid calling the PasswordResetConfirmView `dispatch` method
        # as it contains behaviours not suited for our user flow
        return super(PasswordResetConfirmView, self).dispatch(*args, **kwargs)

    def form_valid(self, form):
        form.save()
        return super(PasswordResetConfirmView, self).form_valid(form)


class SuperuserForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = UserCreationForm.Meta.fields

    def save(self, commit=True):
        user = super(SuperuserForm, self).save(commit=False)
        user.is_superuser = True
        if commit:
            user.save()
        return user


class SuperuserFormView(FormView):
    template_name = "registration/superuser_create.html"
    form_class = SuperuserForm
    success_url = "/auth/login"
