from django.contrib import admin

from .models import KV, Show


class ShowAdmin(admin.ModelAdmin):
    list_display = ("created_at", "show_type", "payload")


admin.site.register(Show, ShowAdmin)


class KVAdmin(admin.ModelAdmin):
    list_display = ("key", "value")


admin.site.register(KV, KVAdmin)
