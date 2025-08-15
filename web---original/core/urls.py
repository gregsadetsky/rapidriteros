import django_eventstream
from django.urls import include, path

from core.views import (
    add_show,
    delete_show,
    get_all_shows,
    index,
    set_immediately_show_show,
)

urlpatterns = [
    path("", index, name="index"),
    path("add_show", add_show, name="add_show"),
    # link from the web ui to delete a show
    path("delete_show/<int:show_id>", delete_show, name="delete_show"),
    # link from the web ui to set the show immediately
    path(
        "set_immediately_show_show/<int:show_id>",
        set_immediately_show_show,
        name="set_immediately_show_show",
    ),
    path("internalapi/get_all_shows", get_all_shows, name="get_all_shows"),
    # the worker connects to internalapi/events to be informed of
    # shows to be immediately shown
    path(
        "internalapi/events",
        include(django_eventstream.urls),
        {"channels": ["events"]},
    ),
]
