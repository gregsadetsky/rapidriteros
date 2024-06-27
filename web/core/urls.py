from django.urls import path

from core.views import add_show, get_all_shows, index

urlpatterns = [
    path("", index, name="index"),
    path("add_show", add_show, name="add_show"),
    path("internalapi/get_all_shows", get_all_shows, name="get_all_shows"),
]
