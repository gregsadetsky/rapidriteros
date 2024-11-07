from dotenv import load_dotenv

load_dotenv()

import base64
import io
import json
import logging
import os
import socket
from datetime import datetime
from itertools import cycle
from time import sleep

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
    "osc": os.environ["RENDERER_OSC_HOST"] + "/render",
    "p5": os.environ["RENDERER_P5_HOST"] + "/render",
    "shader": os.environ["RENDERER_SHADER_HOST"] + "/render",
    # ---
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

# this is a **global** (shudder) that specifies whether we are temporarily
# reading frames from the osc renderer, because we've been informed by the django
# web service that the osc renderer received a frame and 'requested'
# to interrupt the current rendering..... this ain't great, but good for now.
OSC_INTERRUPTION_MODE = False


def receive_frames_from_renderer(renderer_name, json_payload=None):
    print("json_payload", json_payload)

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
                # print("event.data", event.data)
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


def worker():
    while True:
        log.info("Worker is working...")

        # fetch all shows from the web microservice
        r = requests.get(WEB_SERVICE_HOST + "/internalapi/get_all_shows")
        json_response = r.json()
        # log.info("got response from web service: %s", json_response)
        all_shows = json_response["shows"]
        # log.info("got shows from web service: %s", all_shows)

        for show in all_shows:
            log.info("Current show: %s", show)

            for frame in receive_frames_from_renderer(
                show["show_type"], json_payload=show["payload"]
            ):
                # we processed 1 frame, we can do other things now
                send_frame_to_display(frame)

                # this is BANANAS, but let's see if we should interrupt this program
                # and immediately switch to OSC mode...
                r = requests.get(
                    WEB_SERVICE_HOST + "/internalapi/get_immediately_show_osc"
                )
                json_response = r.json()
                if json_response["immediately_show_osc"]:
                    # unset it immediately! yes, that's weird!
                    requests.get(
                        WEB_SERVICE_HOST + "/internalapi/unset_immediately_show_osc"
                    )

                    # and immediately show osc!!!
                    for frame in receive_frames_from_renderer("osc", json_payload={}):
                        # we processed 1 frame, we can do other things now
                        send_frame_to_display(frame)

                    # break out of the current show that we interrupted
                    # so that we don't go through all of the accumulated frames that happened
                    # while we were showing the osc frames
                    break
                if json_response["debug_mode"]:
                    debug_show = all_shows[27]
                    frames = receive_frames_from_renderer(debug_show["show_type"], json_payload=debug_show["payload"])
                    for frame in frames:
                        send_frame_to_display(frame)
                    break

                    

            sleep(1)

        if len(all_shows) == 0:
            log.info(
                "No shows found, sleeping for 1 second before re while true-ing..."
            )
            sleep(1)

        # for renderer in cycle(ALL_RENDERERS):
        #     log.info("Current renderer: %s", renderer)
        #     json_payload = None
        #     if renderer == "text":
        #         json_payload = {
        #             "text": "Send 3648 chars of 0 and 1 by OSC to 10.100.7.28 port 12000 to any path. xx",
        #             # "text": "Recurse Center Rapid Riter",
        #         }
        #     for frame in receive_frames_from_renderer(
        #         renderer, json_payload=json_payload
        #     ):
        #         # we processed 1 frame, we can do other things now
        #         send_frame_to_display(frame)
        #     sleep(1)


if __name__ == "__main__":
    worker()
