def custom_postprocessing_hook(generator, result, request, public):
    # Modify the operation IDs in the result schema
    for path, path_info in result['paths'].items():
        for method, operation in path_info.items():
            operation_id = operation.get('operationId')
            if operation_id:
                if path.startswith('/api/db/v0/'):
                    operation['operationId'] = operation_id.replace('db_v0_', '')
                elif path.startswith('/api/ui/v0/'):
                    operation['operationId'] = operation_id.replace('ui_v0_', '')

    return result