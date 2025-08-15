import requests


class UnauthorizedError(Exception):
    pass


# https://github.com/gregsadetsky/checkintopus/blob/main/core/utils_rc_api.py
def _query(token, api_url, api_verb="GET", post_json={}):
    headers = {"Authorization": f"Bearer {token}"}
    url = f"https://www.recurse.com/api/v1/{api_url}"

    if api_verb == "GET":
        r = requests.get(url, headers=headers)
    elif api_verb == "PATCH":
        r = requests.patch(url, headers=headers, json=post_json)
    elif api_verb == "DELETE":
        r = requests.delete(url, headers=headers, json=post_json)
    else:
        raise ValueError(f"Unknown API verb: {api_verb}")

    if not r.ok and r.json().get("message") == "unauthorized":
        raise UnauthorizedError()

    assert r.ok, f"Request failed: {r.text}"

    # delete methods don't return anything
    if api_verb == "DELETE":
        return {}

    return r.json()


def get_hub_visits_for_today(token):
    # https://github.com/recursecenter/wiki/wiki/Recurse-Center-API#hub-visits
    # from docs:
    # "start_date (Date) - inclusive; defaults to today in America/New_York."
    return _query(token, f"/hub_visits")


def get_user_profile(token):
    return _query(token, f"/people/me")
