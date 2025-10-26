from django.urls import include, path
import django_eventstream

from core.views.index import (
    get_all_show_ids,
    get_show,
)

from core.views.oauth.oauth_redirect import oauth_redirect

from core.views.index import index_react
from core.views.api import api

urlpatterns = [
    path("", index_react, name="index_react"),
    path("api/", api.urls),
    path("oauth_redirect", oauth_redirect, name="oauth_redirect"),

    # paths below called by the worker
    path("internalapi/get_all_show_ids", get_all_show_ids, name="get_all_show_ids"),
    path("internalapi/get_show/<int:show_id>", get_show, name="get_show"),

    # the worker connects to internalapi/events to be informed of
    # shows to be immediately shown
    path(
        "internalapi/events",
        include(django_eventstream.urls),
        {"channels": ["events"]},
    ),
]
