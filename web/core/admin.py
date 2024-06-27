from django.contrib import admin

from .models import Show


class ShowAdmin(admin.ModelAdmin):
    list_display = ("created_at", "show_type", "payload")


admin.site.register(Show, ShowAdmin)
