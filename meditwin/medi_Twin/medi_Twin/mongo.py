"""Shared MongoDB helpers for the MediTwin project.

The Django apps in this repository store several domain objects in MongoDB
instead of the relational database. This module provides a single lazy Mongo
client and a small helper for retrieving collections.

Keeping the connection here avoids duplicating client setup in each app and
prevents import-time failures when Django loads URL configuration.
"""

from functools import lru_cache

from django.conf import settings
from pymongo import MongoClient


@lru_cache(maxsize=1)
def get_mongo_client():
	"""Return a cached PyMongo client.

	The client is created lazily so Django can import URL/view modules without
	immediately attempting to reach MongoDB.
	"""
	return MongoClient(settings.MONGO_URI)


@lru_cache(maxsize=1)
def get_database():
	"""Return the configured MongoDB database."""
	client = get_mongo_client()
	return client[settings.MONGO_DB_NAME]


def get_collection(collection_name):
	"""Return a MongoDB collection by name."""
	return get_database()[collection_name]