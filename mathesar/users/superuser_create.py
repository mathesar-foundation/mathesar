from django.contrib.auth import get_user_model, login
from django.contrib.auth.forms import UserCreationForm
from django.views.generic import CreateView

User = get_user_model()


class SuperuserForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = UserCreationForm.Meta.fields

    def save(self, commit=True):
        user = super(SuperuserForm, self).save(commit=False)
        password = self.cleaned_data["password1"]
        user.set_password(password)
        user.is_superuser = True
        if commit:
            user.save()
        return user


class SuperuserFormView(CreateView):
    template_name = "registration/superuser_create.html"
    form_class = SuperuserForm
    success_url = "/auth/login"

    def form_valid(self, form):
        success = super().form_valid(form)
        # Fetch the user object and login
        login(self.request, self.object)
        return success
