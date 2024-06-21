import argparse
import math
import random
import time
from datetime import datetime

from flask import Flask
from pythonosc import udp_client

app = Flask(__name__)

LOCAL_OSC_SERVER_IP = "10.100.7.28"  # ???
LOCAL_OSC_SERVER_PORT = 12000


@app.route("/")
def hello_world():
    print("new web request")
    return f"hello from disco!!! the datetime is {datetime.now()}"


@app.route("/send-one-frame-by-osc")
def send_one_frame():
    client = udp_client.SimpleUDPClient(LOCAL_OSC_SERVER_IP, LOCAL_OSC_SERVER_PORT)

    out = ""
    for y in range(38):
        for x in range(96):
            # (x ^ y) % 9
            out += "1" if (x ^ y) % 9 == 0 else "0"
    client.send_message("/screen", out)

    print("sent")
    return "ok"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
