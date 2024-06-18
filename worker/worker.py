from itertools import cycle
from time import sleep

import requests
import sseclient
from requests.exceptions import ConnectionError

RENDERER_URLS = {
    "text": "http://renderertext:8000/render",
    "udp": "http://rendererosc:8000/render",
}


def receive_frames_from_renderer(renderer_name):
    try:
        response = requests.post(
            RENDERER_URLS[renderer_name],
            headers={"Accept": "text/event-stream"},
            stream=True,
            json={"payload": "some data"},
            # timeout is a tuple of (connect, read) second timeout values
            timeout=(1, 5),
        )
    except requests.RequestException as e:
        print("request exception!!", e)
        return

    assert response.status_code == 200

    # if response.status_code != 200:
    # log.info("Screen endpoint returned %d", response.status_code)
    #     return

    try:
        for event in sseclient.SSEClient(response).events():
            if event.event == "screen_update":
                yield event.data
                # base64_text = event.data
                # image_bytes = base64.b64decode(base64_text)
                # log.info("Image: %d", image_bytes[0])
            elif event.event == "end":
                return
    except requests.RequestException as e:
        print("request exception!!", e)


def show_frame(frame_data):
    print("PRINTING TO SCREEN >>>", frame_data)


def worker():
    all_renderers = cycle(["udp", "text"])

    while True:
        print("Worker is working...")

        for renderer in all_renderers:
            print("Current renderer:", renderer)
            for frame in receive_frames_from_renderer(renderer):
                # we processed 1 frame, we can do other things now
                show_frame(frame)
            sleep(1)


if __name__ == "__main__":
    worker()
