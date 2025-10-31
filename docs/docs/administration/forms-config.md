# Configuring Forms in Mathesar

Mathesar's [**form builder**](../user-guide/forms.md) allows you to create public-facing data collection forms. While forms work out of the box with default settings, administrators may need to configure file upload capabilities and manage form security settings.

## File Upload Configuration

File uploads in public forms are controlled through the `public_form_access` section in your `file_storage.yml` configuration file.

For details on setting up `file_storage.yml`, see the [File storage backend configuration guide](./file-backend-config.md).

### Basic configuration

```yaml
public_form_access:
  enabled: true  # Set to false to disable file uploads via public forms
  max_upload_size: 104857600  # 100MB in bytes
```

**Common file size values:**

- 10 MB: `10485760`
- 50 MB: `52428800`
- 100 MB: `104857600`
- 1 GB: `1073741824`

Omit `max_upload_size` entirely to allow unlimited file sizes (subject to your backend's limits).

### Full example

```yaml
default:
  protocol: s3
  nickname: "My Storage Backend"
  prefix: my-mathesar-bucket
  kwargs:
    client_kwargs:
      endpoint_url: https://s3.us-east-2.amazonaws.com
      region_name: us-east-2
      aws_access_key_id: YOUR_ACCESS_KEY
      aws_secret_access_key: YOUR_SECRET_KEY
public_form_access:
  enabled: true
  max_upload_size: 104857600  # 100MB limit
```

## Security Considerations

Public forms allow anonymous users to insert data directly into your database. Consider these security measures:

### File uploads

When file uploads are enabled:

- Monitor storage usage to avoid exceeding quotas
- Set reasonable file size limits (10-100 MB for most use cases)
- Be aware that all file types are accepted
- Consider storage costs from your provider

### Rate limiting

Mathesar does not include built-in rate limiting for form submissions. Since public forms allow anonymous data entry, implement rate limiting at your reverse proxy to prevent abuse.

For deployments behind Cloudflare or similar CDNs, consider using their built-in rate limiting or WAF rules to throttle requests before they reach your server. These tools offer easy GUI management, reporting, and CAPTCHA challenges to mitigate abuse without manual reverse-proxy configuration.


**Caddy configuration example:**

```caddyfile
@forms {
    path /shares/forms/*
}
rate_limit @forms {
    zone forms {
        key {remote_host}
        events 10
        window 1h
    }
}
```

**Nginx configuration example:**

```nginx
http {
    limit_req_zone $binary_remote_addr zone=forms:10m rate=10r/m;

    server {
        location /shares/forms/ {
            limit_req zone=forms burst=5 nodelay;
            proxy_pass http://mathesar;
        }
    }
}
```

**Additional considerations:**

- Monitor your logs to adjust limits based on legitimate usage patterns
- Consider different limits for different forms based on their sensitivity
- Implement progressive delays for repeated violations

### Database protection

!!! warning "Anonymous data entry"
    Anyone with a shared form link can insert data into your database. Always use restrictive database roles, implement rate limiting, and monitor form submissions for abuse.

- **Use restrictive roles**: Assign forms PostgreSQL roles with minimal permissions (see [Associated Roles](#associated-roles) below)
- **Add database constraints**: Use check constraints, NOT NULL constraints, and foreign keys to validate data
- **Monitor activity**: Set up alerts for unusual submission patterns
- **Regenerate links**: Periodically regenerate form links to invalidate old URLs

## Associated Roles

Each form uses an **Associated Role** that determines which PostgreSQL role inserts records when the form is submitted.

For better security, you can create dedicated roles with minimal permissions:

```sql
-- Create a role for form submissions
CREATE ROLE form_submitter;

-- Grant only INSERT permission on specific tables
GRANT INSERT ON TABLE service_requests TO form_submitter;
GRANT INSERT ON TABLE customers TO form_submitter;
GRANT USAGE ON SCHEMA public TO form_submitter;
```

Then select this role in the form's **Associated Role** dropdown in the form editor.

## Related documentation

- [Working with forms](../user-guide/forms.md) - User guide for creating and using forms
- [File storage backend configuration](./file-backend-config.md) - Setting up file storage backends
- [PostgreSQL roles](../user-guide/roles.md) - Understanding PostgreSQL roles and permissions
