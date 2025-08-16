from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django_eventstream import send_event
from django.conf import settings

from core.models import Show
from core.views.oauth.utils import get_rc_oauth

def index_react(request):
    if not request.user.is_authenticated:
        return get_rc_oauth().authorize_redirect(
            request, settings.RC_OAUTH_REDIRECT_URI
        )
    return render(request, "core/index_react.html")


# JSON api for the worker to get all shows as a list of dicts
def get_all_shows(request):
    all_shows = Show.objects.filter(disabled=False).order_by("created_at")
    shows = []
    for show in all_shows:
        shows.append(
            {"id": show.id, "show_type": show.show_type, "payload": show.payload}
        )
    return JsonResponse({"shows": shows})


def set_immediately_show_show(request, show_id):
    # FIXME LATER
    # FIXME LATER
    # FIXME LATER
    return HttpResponse("no")

    send_event("events", "show_immediately", {"show_id": show_id})
    return redirect("index_react")
