from django import forms
from django.contrib.auth import get_user_model, password_validation
from django.contrib.auth.forms import UsernameField
from django.contrib.auth.mixins import UserPassesTestMixin
from django.core.exceptions import ValidationError
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _
from django.views.generic import FormView


class PasswordResetForm(forms.Form):
    username = UsernameField(widget=forms.TextInput(attrs={'autofocus': True}))

    error_messages = {
        'password_mismatch': _('The two password fields didn’t match.'),
        'invalid_user': _('User with username does not exist')
    }
    required_css_class = 'required'
    password1 = forms.CharField(
        label=_("Password"),
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password', 'autofocus': True}),
        strip=False,
        help_text=password_validation.password_validators_help_text_html(),
    )
    password2 = forms.CharField(
        label=_("Password (again)"),
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'}),
        strip=False,
        help_text=_("Enter the same password as before, for verification."),
    )

    def clean_username(self):
        username = self.cleaned_data.get("username")
        try:
            get_user_model()._default_manager.get(username=username)
        except get_user_model().DoesNotExist:
            raise ValidationError(
                self.error_messages['invalid_user'],
                code='invalid_user',
            )
        return username

    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        if password1 and password2:
            if password1 != password2:
                raise ValidationError(
                    self.error_messages['password_mismatch'],
                    code='password_mismatch',
                )
        return password2

    def save(self, commit=True):
        """Save the new password."""
        username = self.cleaned_data["username"]
        password = self.cleaned_data["password1"]
        user = get_user_model()._default_manager.get(username=username)
        user.set_password(password)
        if commit:
            user.save()
        return user

    @property
    def changed_data(self):
        data = super().changed_data
        for name in self.fields:
            if name not in data:
                return []
        return ['password']


class SuperuserRequiredMixin(UserPassesTestMixin):
    def test_func(self):
        return self.request.user.is_superuser


class ResetPasswordView(SuperuserRequiredMixin, FormView):
    template_name = 'users/password_reset.html'
    form_class = PasswordResetForm
    success_url = reverse_lazy('home')

    def form_valid(self, form):
        form.save(commit=True)
        return super().form_valid(form)
