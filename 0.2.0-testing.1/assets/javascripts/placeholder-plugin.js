// if this script is loaded first, placeholder.min.js will find window.PlaceholderPluginConfigJson
window.PlaceholderPluginConfigJson = {"placeholder_list": [{"name": "MATHESAR_INSTALLATION_DIR", "description": "", "read_only": false, "allow_inner_html": false, "type": "textbox", "allow_recursive": true, "validators": [], "default_value": "/etc/mathesar"}, {"name": "MATHESAR_PG_DIR", "description": "", "read_only": false, "allow_inner_html": false, "type": "textbox", "allow_recursive": true, "validators": [], "default_value": "/var/lib/docker/volumes/mathesar_postgresql_data/_data"}, {"name": "DOMAIN_NAME", "description": "", "read_only": false, "allow_inner_html": false, "type": "textbox", "allow_recursive": true, "validators": [], "default_value": "localhost"}], "settings": {"debug": false, "delay_millis": 0}, "validators": []};

// this will initialize the plugin if it was loaded before this file
document.dispatchEvent(new Event("PlaceholderPluginConfigJson"));
