def custom_preprocessing_hook(endpoints):
    filtered = []
    for (path, path_regex, method, callback) in endpoints:
        # Remove all but DRF API endpoints
        if path.startswith("/api/db/v0/databases/") or path.startswith("/api/db/v0/data_files/") or path.startswith("/api/db/v0/schemas/") or path.startswith("/api/db/v0/tables/"):
            filtered.append((path, path_regex, method, callback))
    return filtered


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
