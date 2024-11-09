from django.urls import path

from core.views import (
    add_show,
    delete_show,
    get_all_shows,
    get_immediately_show_osc,
    index,
    set_immediately_show_osc,
    unset_immediately_show_osc,
    get_immediately_show_show,
    set_immediately_show_show,
    unset_immediately_show_show,
)

urlpatterns = [
    path("", index, name="index"),
    path("add_show", add_show, name="add_show"),
    path("delete_show/<int:show_id>", delete_show, name="delete_show"),
    path("internalapi/get_all_shows", get_all_shows, name="get_all_shows"),
    path(
        "internalapi/set_immediately_show_osc",
        set_immediately_show_osc,
        name="set_immediately_show_osc",
    ),
    path(
        "internalapi/get_immediately_show_osc",
        get_immediately_show_osc,
        name="get_immediately_show_osc",
    ),
    path(
        "internalapi/unset_immediately_show_osc",
        unset_immediately_show_osc,
        name="unset_immediately_show_osc",
    ),
    path(
        "set_immediately_show_show/<int:show_id>",
        set_immediately_show_show,
        name="set_immediately_show_show",
    ),
    path(
        "get_immediately_show_show",
        get_immediately_show_show,
        name="get_immediately_show_show",
    ),
    path(
        "unset_immediately_show_show",
        unset_immediately_show_show,
        name="unset_immediately_show_show",
    ),
]
