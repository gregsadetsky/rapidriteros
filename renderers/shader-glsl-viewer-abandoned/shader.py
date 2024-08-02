import asyncio
import logging
import os
import re
import shutil
import subprocess
import tempfile
import time
from base64 import b64encode
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated, AsyncGenerator

from fastapi import Body, FastAPI, Request
from PIL import Image
from sse_starlette import ServerSentEvent
from sse_starlette.sse import EventSourceResponse

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)
log.info("Initializing shader")

SCREEN_WIDTH = 96
SCREEN_HEIGHT = 38


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("starting shader server")
    yield
    log.info("closing shader server...??")


app = FastAPI(lifespan=lifespan)


async def render_stream(shader_code) -> AsyncGenerator[ServerSentEvent, None]:
    log.info("New HTTP connection for /render")

    # create temporary folder where .png files will be written by glslviewer
    temporary_png_directory = tempfile.mkdtemp()

    path_to_shader_code = os.path.join(temporary_png_directory, "shader.frag")

    # write shader code to temporary directory
    with open(path_to_shader_code, "w") as f:
        f.write(shader_code)

    # FIXME
    total_files_to_be_generated = 10 * 10
    glslviewer_started_timestamp = time.time()
    maximum_duration_of_glslviewer_rendering_s = 60

    p = subprocess.Popen(
        [
            "glslViewer",
            path_to_shader_code,
            "--headless",
            "-w",
            # FIXME -- only need to halve output size on macs..?
            "49",
            "-h",
            "19",
            "-E",
            # FIXME
            # FIXME
            # FIXME
            "sequence,0,10,10",
        ],
        cwd=temporary_png_directory,
    )

    total_files_processed = 0

    try:
        # is there a png file in the directory i.e. a file we haven't processed/sent yet?
        while True:
            if (
                time.time() - glslviewer_started_timestamp
                > maximum_duration_of_glslviewer_rendering_s
            ):
                # something went wrong, or we're passed the allocated time..? anyway, break
                break

            if total_files_processed >= total_files_to_be_generated:
                # we're done, break
                break

            all_png_files = sorted(list(Path(temporary_png_directory).glob("*.png")))
            if len(all_png_files) == 0:
                # maybe glslviewer has not started, or there's a hiccup...?
                # wait and try again.
                await asyncio.sleep(0.1)
                continue

            # read files as they appear, ditter and base64-them, send them back as a server side event,
            # then delete png file.

            # get the first unprocessed png file
            png_file_path = str(all_png_files[0])
            # make yet another path, to the didder'ed file
            diddered_png_file_path = png_file_path.replace(".png", "_diddered.png")

            # call didder on the frame
            subprocess.check_output(
                # FIXME path to didder!!!
                # FIXME path to didder!!!
                # FIXME path to didder!!!
                # FIXME path to didder!!!
                # f'/opt/homebrew/bin/didder --palette "black white" -i {png_file_path} -o {diddered_png_file_path} bayer 16x16'
                [
                    "/opt/homebrew/bin/didder",
                    "-p",
                    "black white",
                    "-i",
                    png_file_path,
                    "-o",
                    diddered_png_file_path,
                    "bayer",
                    "16x16",
                ]
            )

            # open the didder frame with imagemagick and get its base64 version
            image = Image.open(diddered_png_file_path)
            image = image.convert("1")
            image_bytes = image.tobytes()
            image_base64 = b64encode(image_bytes).decode("utf-8")

            yield ServerSentEvent(
                event="screen_update",
                data=image_base64,
            )

            # delete the png file
            os.remove(png_file_path)
            # delete the didder version of the png file
            os.remove(diddered_png_file_path)

            total_files_processed += 1

        yield ServerSentEvent(
            event="end",
        )
    finally:
        # after minute is done -- or if /render is disconnected from (because of osc override??),
        # stop/kill glslviewer and also delete temporary folder.

        # delete temporary folder
        shutil.rmtree(temporary_png_directory)

        # kill glslviewer
        p.terminate()

        log.info("HTTP connection for /render disconnected")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting shader server")
    loop = asyncio.get_running_loop()
    yield


app = FastAPI(lifespan=lifespan)


@app.post("/render")
async def render(request: Request):
    shader_code = (await request.json())["shader"]
    return EventSourceResponse(render_stream(shader_code=shader_code))


log.info("shader server running")
