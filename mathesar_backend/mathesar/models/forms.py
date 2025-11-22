from django.db import models

class FormField(models.Model):
    label = models.CharField(max_length=255)
    help = models.CharField(max_length=255, blank=True, null=True)
    kind = models.CharField(max_length=50)
    submit_button_label = models.CharField(max_length=100, blank=True, null=True)
    interaction_rule = models.CharField(max_length=200, blank=True, null=True)

    def __str__(self):
        return self.label
