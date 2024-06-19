import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from pythonosc.osc_packet import OscPacket
from sse_starlette import ServerSentEvent
from sse_starlette.sse import EventSourceResponse

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)
log.info("Initializing OSC")

UDP_PORT = 12000

queues: list[asyncio.Queue[str]] = []


class OscUDPServer(asyncio.DatagramProtocol):
    def connection_made(self, transport):
        self.transport = transport

    def datagram_received(self, data, addr):
        global queues
        try:
            osc_packet = OscPacket(data)
            log.info("Received OSC packet: %s", osc_packet)
            log.info("OSC messages: %s", osc_packet.messages)
            for osc_message in osc_packet.messages:
                log.info("OSC message: %s", osc_message)
                log.info("OSC message.message: %s", osc_message.message)
        except UnicodeDecodeError:
            log.error("Failed to UTF-8 decode OSC str: %s", data)
            return
        for queue in queues:
            queue.put_nowait(osc_str)

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
