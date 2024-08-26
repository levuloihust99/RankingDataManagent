import asyncio
import logging
from functools import partial

from sanic import Sanic
from sanic.signals import Event

logger = logging.getLogger(__name__)

async def exception_handler(app: Sanic, exception):
    async def do_purge_tasks():
        app.purge_tasks()
    app.loop.create_task(do_purge_tasks())


def register_exception_handler(app: Sanic):
    app.add_signal(
        partial(exception_handler, app=app),
        Event.SERVER_EXCEPTION_REPORT
    )
