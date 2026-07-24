"""
Custom JSON encoder that handles MongoDB-specific types.
Used by DRF's Response to serialize datetime and ObjectId from PyMongo docs.
"""
from datetime import datetime, date
from bson import ObjectId
from rest_framework.renderers import JSONRenderer
import json


class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, date):
            return obj.isoformat()
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)


class MongoJSONRenderer(JSONRenderer):
    encoder_class = MongoJSONEncoder
