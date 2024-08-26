import html
import logging

import sanic
from sanic import Blueprint
from sanic.request.types import Request

from lib.diff import diff_text

logger = logging.getLogger(__name__)

bp = Blueprint(name="common")


@bp.route("/health_check", methods=["GET"])
async def health_check(request: Request):
    return sanic.json({"status": "OK"})


@bp.route("/diff", methods=["POST"])
async def diff_texts(request: Request):
    data = request.json
    diffs = []
    for item in data:
        diffs.append(diff_text(item["diffTo"], item["diffOn"]))
    for diff in diffs:
        for op in diff:
            op["text"] = html.escape(op["text"])
    return sanic.json(diffs)
