import os
import logging
import argparse

from sanic import Sanic
from sanic_cors import CORS

from apps.utils.exception_handlers import register_exception_handler
from apps.utils.middleware import register_middleware

from lib.utils.logging import do_setup_logging
from apps.constants import MAIN_APP
from apps.main.routes import bp

from decouple import config

do_setup_logging()
logger = logging.getLogger(__name__)

app = Sanic(MAIN_APP)
CORS(app)
app.config.RESPONSE_TIMEOUT = 300
register_exception_handler(app)
register_middleware(app, service="MAIN")
app.blueprint(bp)

parser = argparse.ArgumentParser()
parser.add_argument(
    "--port", "-p", type=int, default=config("PORT", cast=int, default=5555)
)
args = parser.parse_args()


def main():
    app.run(host="0.0.0.0", port=args.port, single_process=True)


if __name__ == "__main__":
    main()
