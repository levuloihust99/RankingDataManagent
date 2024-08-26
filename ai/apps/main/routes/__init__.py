from sanic import Blueprint

from . import common

bp = Blueprint.group(common.bp)
