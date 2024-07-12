import json

from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render

from .models import KV, Show


def get_immediately_show_osc(request):
    return JsonResponse({"immediately_show_osc": KV.get("immediately_show_osc")})


def set_immediately_show_osc(request):
    KV.set("immediately_show_osc", True)
    return HttpResponse("ok")


def unset_immediately_show_osc(request):
    KV.set("immediately_show_osc", False)
    return HttpResponse("ok")


def index(request):
    all_shows = Show.objects.all().order_by("created_at")
    return render(request, "index.html", {"all_shows": all_shows})


def delete_show(request, show_id):
    Show.objects.filter(id=show_id).delete()
    return redirect("index")


def add_show(request):
    show_content = request.POST.get("show_content")
    show_type = request.POST.get("show_type")

    Show.objects.create(show_type=show_type, payload={show_type: show_content})

    return redirect("index")


# JSON api for the worker to get all shows as a list of dicts
def get_all_shows(request):
    all_shows = Show.objects.all().order_by("created_at")
    shows = []
    for show in all_shows:
        shows.append(
            {"id": show.id, "show_type": show.show_type, "payload": show.payload}
        )
    return JsonResponse({"shows": shows})
