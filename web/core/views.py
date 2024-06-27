from django.http import HttpResponse

from .models import HitCounterModel


def index(request):
    # create a hit
    HitCounterModel.objects.create()
    # get number of hits
    hits = HitCounterModel.objects.count()

    return HttpResponse(
        f"Hello, world. This is the index page. You are visitor number {hits}."
    )
