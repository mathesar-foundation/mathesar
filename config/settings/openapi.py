def custom_preprocessing_hook(endpoints):
    filtered = []
    for (path, path_regex, method, callback) in endpoints:
        # Remove all but DRF API endpoints
        if path.startswith("/api/db/v0/databases/"):
            filtered.append((path, path_regex, method, callback))
    return filtered
