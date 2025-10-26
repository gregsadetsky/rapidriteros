from django.contrib.auth.models import AbstractUser
from django.db import models


# https://docs.djangoproject.com/en/4.2/topics/auth/customizing/#using-a-custom-user-model-when-starting-a-project
class User(AbstractUser):
    pass


class Show(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    SHOW_TYPES = [
        ("text", "Text"),
        ("shader", "Shader"),
        ("p5", "P5"),
        ("wasm", "WASM"),
    ]

    show_type = models.CharField(max_length=100, choices=SHOW_TYPES)
    # json blob
    payload = models.JSONField()

    def __str__(self):
        preamble = f"{self.show_type} - {self.created_at}"
        if self.show_type == "text":
            return self.payload.get("text")
        elif self.show_type == "p5":
            return self.payload.get("p5")[0:100] + "..."
        elif self.show_type == "shader":
            return self.payload.get("shader")[0:100] + "..."
        elif self.show_type == "wasm":
            return self.payload.get("wasm")[0:100] + "..."
        return preamble

    disabled = models.BooleanField(default=False)
    is_preview = models.BooleanField(default=False)


KV_DEFAULTS = {}


class KV(models.Model):
    key = models.CharField(max_length=100)
    value = models.JSONField()

    # make a class method to get a value, resort to the default, otherwise raise
    @classmethod
    def get(cls, key):
        try:
            return cls.objects.get(key=key).value
        except cls.DoesNotExist:
            return KV_DEFAULTS[key]

    # create a set that gets + updates or creates
    @classmethod
    def set(cls, key, value):
        obj, created = cls.objects.update_or_create(key=key, defaults={"value": value})
        return obj

    def __str__(self):
        return f"{self.key} - {self.value}"
