"""Shared slowapi limiter.

Kept in its own module so both `main.py` (which registers the middleware +
429 handler) and the routers (which decorate endpoints) can import the same
Limiter instance without a circular import.
"""
# pyrefly: ignore [missing-import]
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
