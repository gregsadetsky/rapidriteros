import json

from django.http import HttpResponse, JsonResponse
from django.shortcuts import render

from .models import Show


def exception(request):
    raise Exception("This is an exception!")


def index(request):
    all_shows = Show.objects.all().order_by("-created_at")
    return render(request, "index.html", {"all_shows": all_shows})


def add_show(request):
    # get payload from form input name="text_show_payload"

    payload = request.POST.get("text_show_payload")
    # payload is JSON! read it, and it fails, alert the user
    try:
        payload = json.loads(payload)
    except json.JSONDecodeError:
        return HttpResponse("Invalid JSON!!")

    Show.objects.create(show_type="text", payload=payload)

    return HttpResponse("Show added!")


# JSON api for the worker to get all shows as a list of dicts
def get_all_shows(request):
    all_shows = Show.objects.all().order_by("-created_at")
    shows = []
    for show in all_shows:
        shows.append(
            {"id": show.id, "show_type": show.show_type, "payload": show.payload}
        )
    return JsonResponse({"shows": shows})
