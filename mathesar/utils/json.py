import datetime

from rest_framework.utils.encoders import JSONEncoder
from rest_framework.renderers import JSONRenderer


class MathesarJSONEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime.time):
            representation = obj.isoformat()
            return representation
        else:
            return super().default(obj)


class MathesarJSONRenderer(JSONRenderer):
    encoder_class = MathesarJSONEncoder
