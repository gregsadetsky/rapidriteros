from dotenv import load_dotenv

load_dotenv()

import base64
import io
import json
import logging
import os
import queue
import socket
import threading
import time
from datetime import datetime
from itertools import cycle

import numpy as np
import requests
import sseclient
from PIL import Image
from requests.exceptions import ConnectionError

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)
log.info("Initializing Worker")

DO_NOT_SEND_TO_RITER = os.environ["DO_NOT_SEND_TO_RITER"] == "true"
WEB_SERVICE_HOST = os.environ["WEB_SERVICE_HOST"]

RENDERER_URLS = {
    "text": os.environ["RENDERER_TEXT_HOST"] + "/render",
    "p5": os.environ["RENDERER_P5_HOST"] + "/render",
    "shader": os.environ["RENDERER_SHADER_HOST"] + "/render",
    "wasm": os.environ["RENDERER_WASM_HOST"] + "/render",
    # ---
    # "osc": os.environ["RENDERER_OSC_HOST"] + "/render",
    # "noise": "http://renderernoise/render",
    # "image": "http://rendererimage/render",
}
ALL_RENDERERS = list(RENDERER_URLS.keys())

# PROD i.e. disco on raspi
SCREEN_UDP_IP = "10.0.0.42"
SCREEN_UDP_PORT = 6450

SCREEN_WIDTH = 96
SCREEN_HEIGHT = 38

SCREEN_SOCK = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)  # UDP

RENDERER_CONNECT_TIMEOUT_S = 5
RENDERER_READ_TIMEOUT_S = 5

SERVER_SIDE_EVENTS_QUEUE = queue.Queue()


def receive_frames_from_renderer(renderer_name, json_payload=None):
    try:
        response = requests.post(
            RENDERER_URLS[renderer_name],
            headers={
                "Accept": "text/event-stream",
                "Content-Type": "application/json",
            },
            stream=True,
            json=json_payload,
            # timeout is a tuple of (connect, read) second timeout values
            timeout=(RENDERER_CONNECT_TIMEOUT_S, RENDERER_READ_TIMEOUT_S),
        )
    except requests.RequestException as e:
        log.error("request exception!! %s", e)
        return

    if not response.ok:
        log.error("request failed!! %s", response.text)
        return

    assert response.status_code == 200

    try:
        for event in sseclient.SSEClient(response).events():
            if event.event == "screen_update":
                base64_text = event.data
                image_bytes = base64.b64decode(base64_text)
                yield image_bytes
            elif event.event == "end":
                return
    except requests.RequestException as e:
        # log.error("request exception!! %s", e)
        return


def send_frame_to_display(pillow_raw_image_data):
    # FIXME
    # FIXME
    # FIXME
    # THIS ASSUMES THAT pillow_raw_image_data WAS IN MODE 1!!!!
    # IT MIGHT NOT BE!!!

    # expecting base64 1 channel png, fail otherwise
    pil_image = Image.frombytes("1", (96, 38), pillow_raw_image_data)
    # assert that it's exactly 96x38
    assert pil_image.size == (SCREEN_WIDTH, SCREEN_HEIGHT)
    # assert that its mode is 1 i.e. black and white
    assert pil_image.mode == "1"

    frame = np.zeros((SCREEN_HEIGHT * SCREEN_WIDTH, 1), bool)

    np_image = np.asarray(pil_image)

    # flip img from right-left to left-right
    np_image = np.flip(np_image, 1)

    frame_packed_bits = np.packbits(
        np_image.astype("bool"), axis=None, bitorder="little"
    )

    if DO_NOT_SEND_TO_RITER:
        # go through the lines and columns
        # and print '.' for 0 bit and '#' for 1 bit
        # clear terminal!!!!!
        print("\033c")
        for y in range(SCREEN_HEIGHT):
            for x in range(SCREEN_WIDTH - 1, 0, -1):
                if np_image[y][x] == 1:
                    print("#", end="")
                else:
                    print(".", end="")
            print()
    else:
        SCREEN_SOCK.sendto(frame_packed_bits, (SCREEN_UDP_IP, SCREEN_UDP_PORT))


def consume_server_side_events():
    print("consume_server_side_events")
    # consume WEB_SERVICE_HOST + "/internalapi/events"
    # to set the current show and change to osc mode

    while True:
        print("consume_server_side_events loop")
        response = requests.get(
            WEB_SERVICE_HOST + "/internalapi/events",
            headers={
                "Accept": "text/event-stream",
                "Content-Type": "application/json",
            },
            stream=True,
        )
        assert response.ok
        for event in sseclient.SSEClient(response).events():
            # we get 'keep-alive' events from the server, which are nice, sure,
            # but they are defffffffinitely not something we want to queue or care
            # about!!!
            if event.event == "keep-alive":
                continue
            print("consume_server_side_events event", event)
            SERVER_SIDE_EVENTS_QUEUE.put(event)
        time.sleep(1)


def get_all_shows():
    # fetch all shows from the web microservice
    r = requests.get(WEB_SERVICE_HOST + "/internalapi/get_all_shows")
    json_response = r.json()
    return json_response["shows"]


def worker():
    while True:
        log.info("worker loop")

        all_shows = get_all_shows()
        for show in all_shows:
            print("show type", show["show_type"])
            print("show", json.dumps(show)[:100], "...")

            for frame in receive_frames_from_renderer(
                show["show_type"], json_payload=show["payload"]
            ):
                # print("receive_frames_from_renderer")
                # we processed 1 frame, we can do other things now
                send_frame_to_display(frame)

                # get any event from the queue, but don't block if there's no event
                event = None
                try:
                    event = SERVER_SIDE_EVENTS_QUEUE.get(block=False)
                except queue.Empty:
                    pass

                if event and event.event == "show_immediately":
                    show_id = json.loads(event.data)["show_id"]
                    print(f"IMMEDIATELY JUMPING TO SHOW {show_id}")

                    # Load all the shows again in case they just added it! Helps with _rapid_ prototyping
                    all_shows = get_all_shows()
                    filtered_shows = [
                        show for show in all_shows if show["id"] == show_id
                    ]
                    assert len(filtered_shows) == 1, "did not find show??"
                    show = filtered_shows[0]
                    # and immediately show show!!!
                    for frame in receive_frames_from_renderer(
                        show["show_type"], json_payload=show["payload"]
                    ):
                        # we're now locked in the interrupting show
                        # i.e. you can't interrupt an interrupting show
                        # with another show!
                        send_frame_to_display(frame)

                    # break out of the show that we originally interrupted
                    # so that we don't go through all of the accumulated frames that happened
                    # while we were showing the osc/immediate show frames
                    break

            time.sleep(1)

        if len(all_shows) == 0:
            log.info(
                "No shows found, sleeping for 1 second before re while true-ing..."
            )
            time.sleep(1)


if __name__ == "__main__":
    thread = threading.Thread(target=consume_server_side_events)
    thread.start()

    worker()
