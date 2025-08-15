from django.urls import include, path
import django_eventstream

from core.views.index import (
    add_show,
    delete_show,
    get_all_shows,
    set_immediately_show_show,
)

from core.views.oauth.oauth_redirect import oauth_redirect

from core.views.index import index_react
from core.views.api import api

urlpatterns = [
    path("", index_react, name="index_react"),
    path("api/", api.urls),
    path("oauth_redirect", oauth_redirect, name="oauth_redirect"),
    # paths below are once logged in
    path("add_show", add_show, name="add_show"),
    # link from the web ui to delete a show
    path("delete_show/<int:show_id>", delete_show, name="delete_show"),
    # link from the web ui to set the show immediately
    path(
        "set_immediately_show_show/<int:show_id>",
        set_immediately_show_show,
        name="set_immediately_show_show",
    ),
    # paths below called by the worker
    path("internalapi/get_all_shows", get_all_shows, name="get_all_shows"),
    # the worker connects to internalapi/events to be informed of
    # shows to be immediately shown
    path(
        "internalapi/events",
        include(django_eventstream.urls),
        {"channels": ["events"]},
    ),
]
