from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render, get_object_or_404
from django.conf import settings

from core.models import Show
from core.views.oauth.utils import get_rc_oauth

def index_react(request):
    if not request.user.is_authenticated:
        return get_rc_oauth().authorize_redirect(
            request, settings.RC_OAUTH_REDIRECT_URI
        )
    return render(request, "core/index_react.html")


def get_show(request, show_id):
    show = get_object_or_404(Show, id=show_id)
    if show.disabled:
        return JsonResponse({"error": "Show is disabled"}, status=404)
    return JsonResponse({"show_type": show.show_type, "payload": show.payload})


# JSON api for the worker to get all show ids (ie a list of ints)
def get_all_show_ids(request):
    all_shows = Show.objects.filter(disabled=False, is_preview=False).order_by("created_at")
    show_ids = []
    for show in all_shows:
        show_ids.append(show.id)
    return JsonResponse({"show_ids": show_ids})
