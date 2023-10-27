def custom_preprocessing_hook(endpoints):
    prefixes = [
        "/api/db/v0/databases/",
        "/api/db/v0/data_files/",
        "/api/db/v0/schemas/",
        "/api/db/v0/tables/",
        "/api/db/v0/links/",
        "/api/db/v0/queries/",
        "/api/ui/v0/databases/",
        "/api/ui/v0/users/"
    ]
    filtered = [(path, path_regex, method, callback) for path, path_regex, method, callback in endpoints if any(path.startswith(prefix) for prefix in prefixes)]
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
