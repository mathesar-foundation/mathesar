from django.contrib.auth import get_user_model, login
from django.contrib.auth.forms import UserCreationForm
from django.views.generic import CreateView
from django import forms
from mathesar.analytics import upload_initial_report, initialize_analytics
import logging

User = get_user_model()


class CompleteInstallationForm(UserCreationForm):
    one_time_installation_confirmation = forms.BooleanField(required=False)
    usage_stats = forms.BooleanField(required=False)

    class Meta(UserCreationForm.Meta):
        model = User
        fields = UserCreationForm.Meta.fields

    def save(self, commit=True):
        logger = logging.getLogger('complete_installation')
        user = super(CompleteInstallationForm, self).save(commit=False)
        password = self.cleaned_data["password1"]
        user.set_password(password)
        user.is_superuser = True

        one_time_installation_confirmation = self.cleaned_data["one_time_installation_confirmation"]
        usage_stats = self.cleaned_data["usage_stats"]

        if commit:
            user.save()

        if one_time_installation_confirmation:
            try:
                upload_initial_report()
            except Exception as e:
                logger.error("Unable to send one time installation confirmation", exc_info=e)

        if usage_stats:
            try:
                initialize_analytics()
            except Exception as e:
                logger.error("Unable to initialize analytics", exc_info=e)

        return user


class CompleteInstallationFormView(CreateView):
    template_name = "installation/complete_installation.html"
    form_class = CompleteInstallationForm
    success_url = "/auth/login"

    def form_valid(self, form):
        success = super().form_valid(form)
        # Fetch the user object and login
        login(self.request, self.object)
        return success
