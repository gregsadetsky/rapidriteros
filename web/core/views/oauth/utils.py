from authlib.integrations.django_client import OAuth
from django.conf import settings


def get_rc_oauth():
    rc_oauth = OAuth().register(
        "Recurse Center",
        api_base_url="https://www.recurse.com/api/v1/",
        authorize_url="https://www.recurse.com/oauth/authorize",
        access_token_url="https://www.recurse.com/oauth/token",
        client_id=settings.RC_OAUTH_APP_ID,
        client_secret=settings.RC_OAUTH_APP_SECRET,
    )
    assert rc_oauth is not None
    return rc_oauth
