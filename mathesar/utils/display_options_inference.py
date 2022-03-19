import json

from db.types import base
from db.types.base import get_qualified_name
from db.types.money import get_money_array

MATHESAR_MONEY = get_qualified_name(base.MathesarCustomType.MATHESAR_MONEY.value)


def infer_mathesar_money_display_options(table_oid, engine, column_attnum):
    money_array = get_money_array(table_oid, engine, column_attnum)
    if money_array is None:
        return None
    else:
        with open("currency_info.json", 'r') as currency_file:
            currency_dict = json.loads(currency_file.read())
            for currency_code, currency_details in currency_dict.items():
                if currency_details['currency_symbol'] == money_array[3]:
                    return {'currency_code': currency_code}
            return {'decimal_symbol': money_array[2], 'digit_grouping_symbol': money_array[1], 'symbol': money_array[3], 'symbol_location': 'Beginning', 'digit_grouping': []}


def get_table_column_display_options(table, col_name_type_dict):
    inferred_display_options = {}
    for column_name, columnn_type in col_name_type_dict.items():
        inference_fn = display_options_inference_map.get(columnn_type.lower())
        if inference_fn is not None:
            inferred_display_options[column_name] = inference_fn(table.oid, table.schema._sa_engine, column_name)
        else:
            inferred_display_options[column_name] = None
    return inferred_display_options


display_options_inference_map = {
    MATHESAR_MONEY: infer_mathesar_money_display_options
}
