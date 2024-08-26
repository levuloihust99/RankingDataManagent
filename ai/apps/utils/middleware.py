import logging
from datetime import datetime
from functools import partial

from sanic import Sanic, Request

logger = logging.getLogger(__name__)


async def before_request_func(request: Request):
    logger.info("{} {}".format(request.method, request.path))
    request.ctx.start_time = datetime.now()


async def after_response_func(request, response, service: str = "MAIN"):
    logger.info(
        "[{} service] Total processing time: {}".format(
            service, datetime.now() - request.ctx.start_time
        )
    )


def register_middleware(app: Sanic, service: str = "MAIN"):
    app.register_middleware(before_request_func, "request")
    app.register_middleware(partial(after_response_func, service=service), "response")
