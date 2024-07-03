from django.urls import path

from core.views import (
    add_show,
    delete_show,
    get_all_shows,
    get_immediately_show_osc,
    index,
    set_immediately_show_osc,
    unset_immediately_show_osc,
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
]
