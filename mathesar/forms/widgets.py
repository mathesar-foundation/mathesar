from django.forms.widgets import TextInput

class DataListInput(TextInput):
    """
    Widget that adds a <data_list> element to the standard text input widget.
    See TextInput for further details.

    Attributes:
        data_list: List of strings, where each string is a data_list value, or
        a callable that returns a list of the same form
        data_list_id: ID of the data_list, generated when render() is called.
        Of the form [widget_id | widget_name]_data_list
    """
    template_name = "mathesar/widgets/data_list.html"

    def __init__(self, data_list, attrs=None):
        super().__init__(attrs=attrs)
        self.data_list = data_list
        self.data_list_id = "_data_list"

    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        if callable(self.data_list):
            context["widget"]["data_list"] = self.data_list()
        else:
            context["widget"]["data_list"] = self.data_list
        context["widget"]["data_list_id"] = self.data_list_id
        return context

    def render(self, name, value, attrs=None, renderer=None):
        # In practice, there should always be an ID attribute, but we fallback
        # to using widget name if ID is missing
        if attrs and "id" in attrs:
            self.data_list_id = attrs["id"] + "_data_list"
        else:
            self.data_list_id = name + "_data_list"
        attrs = {} if attrs is None else attrs
        attrs["list"] = self.data_list_id
        return super().render(name, value, attrs, renderer)

