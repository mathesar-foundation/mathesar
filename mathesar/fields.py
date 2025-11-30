# mathesar/fields.py

import json
from encrypted_fields.fields import EncryptedTextField

class EncryptedJSONField(EncryptedTextField):
    """
    Encrypts JSON data by serializing to string before encryption,
    and deserializing after decryption.
    """

    def get_prep_value(self, value):
        if value is None:
            return None
        return super().get_prep_value(json.dumps(value))

    def from_db_value(self, value, expression, connection):
        if value is None:
            return None
        try:
            return json.loads(super().from_db_value(value, expression, connection))
        except Exception:
            return value

    def to_python(self, value):
        if value is None or isinstance(value, (dict, list)):
            return value
        try:
            return json.loads(value)
        except Exception:
            return value
