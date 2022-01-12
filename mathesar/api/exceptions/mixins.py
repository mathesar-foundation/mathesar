from rest_framework_friendly_errors.mixins import FriendlyErrorMessagesMixin


class MathesarErrorMessageMixin(FriendlyErrorMessagesMixin):

    def build_pretty_errors(self, errors):
        e = super().build_pretty_errors(errors)
        return e['errors']