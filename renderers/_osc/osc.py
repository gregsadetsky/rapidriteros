from dotenv import load_dotenv

load_dotenv()

import asyncio
import logging
import os
import re
from base64 import b64encode
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import requests
from fastapi import FastAPI
from PIL import Image
from pythonosc.osc_packet import OscPacket
from sse_starlette import ServerSentEvent
from sse_starlette.sse import EventSourceResponse

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)
log.info("Initializing OSC")

UDP_PORT = 12000

SCREEN_WIDTH = 96
SCREEN_HEIGHT = 38

WEB_SERVICE_HOST = os.environ["WEB_SERVICE_HOST"]

queues: list[asyncio.Queue[str]] = []


class OscUDPServer(asyncio.DatagramProtocol):
    def connection_made(self, transport):
        self.transport = transport

    def datagram_received(self, data, addr):
        global queues

        osc_packet = OscPacket(data)
        log.info("Received OSC packet")
        log.info("OSC messages: %s", osc_packet.messages)

        if len(queues) == 0:
            # we've received a message, but there are no queues consuming it
            # at this point, we should let the main web server know that osc
            # messages are coming in, and it should stop showing frames
            # from other renderers, and show the content of the osc renderer (i.e. this file/code)
            # instead. one current issue with this is that the first few osc frames WILL be dropped
            # as there is no queue for it yet (as queues are created when the WORKER connects to US)
            # this is good enough for now.
            log.info("No queues, notifying web service")
            requests.get(f"{WEB_SERVICE_HOST}/internalapi/set_immediately_show_osc")
            # that's it! nothing left to do but wait to be connected to
            return

        for osc_message in osc_packet.messages:
            # log.info("OSC message: %s", osc_message)
            # log.info("OSC message.message: %s", osc_message.message)
            # log.info("OSC message.message.params: %s", osc_message.message.params)
            if len(osc_message.message.params) != 1:
                log.error("received more than 1 param")
                continue
            message_param_value = osc_message.message.params[0]
            # log.info("message_param_value len: %d", len(message_param_value))
            if type(message_param_value) != str:
                log.error("received non-str param value")
                continue
            if len(message_param_value) != (SCREEN_WIDTH * SCREEN_HEIGHT):
                log.error("did not receive 96x38 byte string")
                continue
            # check that it only has 0 and 1
            if re.match(r"^[01]+$", message_param_value) is None:
                log.error("strings contains something other than 0 and 1")
                continue

            # at this point, assume that we've received a 96x38 byte string of 0 and 1s
            # make a binary image
            image = Image.new("1", (SCREEN_WIDTH, SCREEN_HEIGHT))
            image.putdata([int(bit) for bit in message_param_value])
            # get bytes
            image_bytes = image.tobytes()
            # base64 encode
            image_base64 = b64encode(image_bytes).decode("utf-8")

            # broadcast frame to all queues
            for queue in queues:
                queue.put_nowait(image_base64)

    def connection_lost(self, exception):
        try:
            self.transport.close()
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting UDP server")
    loop = asyncio.get_running_loop()
    transport, _ = await loop.create_datagram_endpoint(
        lambda: OscUDPServer(),
        local_addr=("0.0.0.0", UDP_PORT),
    )
    yield
    try:
        transport.close()
        log.info("Closed datagram log endpoint")
    except Exception:
        log.exception("Exception closing transport")


app = FastAPI(lifespan=lifespan)


async def render_stream() -> AsyncGenerator[ServerSentEvent, None]:
    global queues
    log.info("New HTTP connection for /render")
    queue: asyncio.Queue[str] = asyncio.Queue()
    queues.append(queue)
    try:
        while True:
            osc_str = await queue.get()
            yield ServerSentEvent(
                event="screen_update",
                data=osc_str,
            )
    finally:
        log.info("HTTP connection for /render disconnected")
        queues.remove(queue)


@app.post("/render")
async def render():
    return EventSourceResponse(render_stream())


log.info("OSC server running")
