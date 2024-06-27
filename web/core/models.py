from django.db import models


class Show(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    SHOW_TYPES = [
        ("text", "Text"),
    ]

    show_type = models.CharField(max_length=100, choices=SHOW_TYPES)
    # json blob
    payload = models.JSONField()

    def __str__(self):
        preamble = f"{self.show_type} - {self.created_at}"
        if self.show_type == "text":
            return f"{preamble} - {self.payload}"
        return preamble
