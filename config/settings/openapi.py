def remove_url_prefix_hook(result, **kwargs):
    # Remove namespace and version URL prefix from the operation Id of the generated API schema
    for path, path_info in result['paths'].items():
        for method, operation in path_info.items():
            operation_id = operation.get('operationId')
            if operation_id:
                if path.startswith('/api/db/v0/'):
                    operation['operationId'] = operation_id.replace('db_v0_', '')
                elif path.startswith('/api/ui/v0/'):
                    operation['operationId'] = operation_id.replace('ui_v0_', '')

    return result
