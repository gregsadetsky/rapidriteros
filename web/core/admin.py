from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User
from .models import KV, Show

admin.site.register(User, UserAdmin)

class ShowAdmin(admin.ModelAdmin):
    list_display = ("created_at", "show_type", "abbreviated_payload", "disabled")
    
    def abbreviated_payload(self, obj):
        return str(obj)
    abbreviated_payload.short_description = "Payload"
    actions = ['bulk_disable', 'bulk_enable']
    
    def bulk_disable(self, request, queryset):
        updated = queryset.update(disabled=True)
        if updated == 1:
            message_bit = "1 show was"
        else:
            message_bit = f"{updated} shows were"
        self.message_user(request, f"{message_bit} successfully disabled.")
    bulk_disable.short_description = "Disable selected shows"
    
    def bulk_enable(self, request, queryset):
        updated = queryset.update(disabled=False)
        if updated == 1:
            message_bit = "1 show was"
        else:
            message_bit = f"{updated} shows were"
        self.message_user(request, f"{message_bit} successfully enabled.")
    bulk_enable.short_description = "Enable selected shows"

admin.site.register(Show, ShowAdmin)

class KVAdmin(admin.ModelAdmin):
    list_display = ("key", "value")

admin.site.register(KV, KVAdmin)
