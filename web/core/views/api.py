from ninja import NinjaAPI
from core.models import Show
from ninja.security import django_auth

api = NinjaAPI(csrf=True)

@api.get("/shows", auth=django_auth)
def get_shows(request):
    shows = Show.objects.all().order_by('created_at')
    shows_data = []
    
    for show in shows:
        shows_data.append({
            'id': show.id,
            'show_type': show.show_type,
            'created_at': show.created_at.isoformat(),
            'disabled': show.disabled,
            'display_text': str(show)
        })
    
    return {'shows': shows_data}

@api.post("/shows/{show_id}/set_disabled", auth=django_auth)
def set_show_disabled(request, show_id: int, disabled: bool):
    try:
        show = Show.objects.get(id=show_id)
        show.disabled = disabled
        show.save()
        return {'success': True, 'disabled': show.disabled}
    except Show.DoesNotExist:
        return {'success': False, 'error': 'Show not found'}