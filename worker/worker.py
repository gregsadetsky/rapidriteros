from dotenv import load_dotenv

load_dotenv()

import sys
import base64
import io
import json
import logging
import os
import socket
import threading
import time
import threading

from datetime import datetime
from itertools import cycle
from collections import deque

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

# PROD i.e. disco on raspi
SCREEN_UDP_IP = "10.0.0.42"
SCREEN_UDP_PORT = 6450

SCREEN_WIDTH = 96
SCREEN_HEIGHT = 38

SCREEN_SOCK = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)  # UDP

RENDERER_CONNECT_TIMEOUT_S = 5
RENDERER_READ_TIMEOUT_S = 5

SHOW_IDS_TO_PLAY = deque()
SHOW_IMMEDIATELY_FLAG = threading.Event()

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

        # print('F', end='')
        # sys.stdout.flush()

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

        try:
            response = requests.get(
                WEB_SERVICE_HOST + "/internalapi/events",
                headers={
                    "Accept": "text/event-stream",
                    "Content-Type": "application/json",
                },
                stream=True,
            )
        except Exception as e:
            print("consume_server_side_events exception!!!", e)
            time.sleep(1)
            continue

        print('consume_server_side_events response???', response)

        if not response.ok:
            print("consume_server_side_events response not ok!!!", response.text)
            time.sleep(1)
            continue

        try:
            for event in sseclient.SSEClient(response).events():
                print('consume_server_side_events event!!!', event)

                # we get 'keep-alive' events from the server, which are nice, sure,
                # but they are defffffffinitely not something we want to queue or care
                # about!!!

                if event.event == "keep-alive":
                    continue

                if event.event == 'show_immediately':
                    SHOW_IDS_TO_PLAY.appendleft(json.loads(event.data)["show_id"])
                    SHOW_IMMEDIATELY_FLAG.set()
        except Exception as e:
            print("consume_server_side_events exception during event loop!!!", e)

        print('consume_server_side_events sleep')
        time.sleep(1)


def get_all_show_ids():
    # fetch all shows from the web microservice
    try:
        r = requests.get(WEB_SERVICE_HOST + "/internalapi/get_all_show_ids")
    except Exception as e:
        log.error(f"error fetching all show ids: {e}")
        return []
    json_response = r.json()
    # just a list of ids!
    return json_response["show_ids"]

def get_show(show_id):
    try:
        r = requests.get(
            WEB_SERVICE_HOST + f"/internalapi/get_show/{show_id}"
        )
    except Exception as e:
        log.error(f"error fetching show id {show_id}: {e}")
        return None

    # handle 404/errors by returning None!
    if not r.ok:
        return None
    json_response = r.json()
    return json_response

def worker():
    while True:
        log.info("worker loop")

        all_show_ids = get_all_show_ids()
        # push them onto the deque
        for show_id in all_show_ids:
            SHOW_IDS_TO_PLAY.append(show_id)

        while len(SHOW_IDS_TO_PLAY):
            show_id = SHOW_IDS_TO_PLAY.popleft()
            show = get_show(show_id)
            if show is None:
                log.info(f"show id {show_id} not found, skipping")
                continue

            for frame in receive_frames_from_renderer(
                show["show_type"], json_payload=show["payload"]
            ):
                send_frame_to_display(frame)

                if SHOW_IMMEDIATELY_FLAG.is_set():
                    log.info("SHOW_IMMEDIATELY_FLAG set, breaking out of current show")
                    SHOW_IMMEDIATELY_FLAG.clear()
                    break
        time.sleep(1)


if __name__ == "__main__":
    thread = threading.Thread(target=consume_server_side_events)
    thread.start()

    worker()
