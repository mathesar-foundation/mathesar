# Configuring Forms in Mathesar

Mathesar's [**form builder**](../user-guide/forms.md) allows you to create public-facing data collection forms. While forms work out of the box with default settings, administrators may need to configure file upload capabilities and manage form security settings.

## When configuration is needed

Most forms work without any additional configuration. However, you may need to configure:

- **File uploads in public forms**: Enable or disable file uploads and set size limits
- **Form permissions**: Configure which PostgreSQL roles forms use for submissions
- **Security settings**: Manage anonymous access and data submission controls

## Public Form Access Configuration

File uploads in public forms are controlled through the `public_form_access` section in your `file_storage.yml` configuration file. This setting applies to all forms in your Mathesar installation.

### Configuration location

The `public_form_access` section is part of your `file_storage.yml` file, which is typically located:

- **Docker Compose installations**: Next to your `docker-compose.yml` file
- **Direct installations**: In your Mathesar installation directory

For details on setting up `file_storage.yml`, see the [File storage backend configuration guide](./file-backend-config.md).

### Enabling or disabling file uploads

The `enabled` flag controls whether users can upload files via public forms:

```yaml
public_form_access:
  enabled: true  # Set to false to disable file uploads via public forms
```

- **`enabled: true`**: Allows file uploads in public forms (default when file storage is configured)
- **`enabled: false`**: Disables file uploads in public forms, even if file storage is configured

When disabled, file columns will still appear in forms created within Mathesar (for authenticated users), but public form submissions will not be able to upload files.

### Setting file size limits

The `max_upload_size` setting limits the maximum file size that can be uploaded through public forms:

```yaml
public_form_access:
  enabled: true
  max_upload_size: 1073741824  # 1GB in bytes
```

**Common size examples:**

- **1 MB**: `1048576`
- **10 MB**: `10485760`
- **100 MB**: `104857600`
- **1 GB**: `1073741824`
- **10 GB**: `10737418240`

!!! note "No size limit"
    If you want to allow unlimited file sizes (subject to your backend's limits), you can omit the `max_upload_size` setting entirely.

### Complete configuration example

Here's a complete `file_storage.yml` example with public form access configuration:

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
  enabled: true  # Enable file uploads in public forms
  max_upload_size: 104857600  # 100MB limit
```

### Applying configuration changes

After modifying `file_storage.yml`, restart Mathesar to apply the changes:

=== "Docker Compose installations"

    ```bash
    docker compose -f docker-compose.yml down
    docker compose -f docker-compose.yml up -d
    ```

=== "Linux, macOS, or WSL installations"

    ```bash
    sudo systemctl restart mathesar.service
    ```

=== "DigitalOcean or Railway"

    Use their web interface to restart (redeploy) Mathesar.

## Security Considerations

### Anonymous file uploads

When file uploads are enabled for public forms, anyone with the form link can upload files to your storage backend. Consider:

- **Storage quotas**: Large files or many uploads can consume significant storage space
- **File type restrictions**: Mathesar accepts all file types; consider monitoring for inappropriate content
- **Rate limiting**: Consider implementing application-level rate limiting if you're concerned about abuse
- **Cost implications**: Depending on your storage provider, uploads may incur costs

### Recommended file size limits

Setting reasonable file size limits helps:

- Prevent accidental uploads of extremely large files
- Control storage costs
- Reduce the risk of abuse
- Improve form submission performance

**Recommendations by use case:**

- **Document uploads**: 10-50 MB typically sufficient
- **Image uploads**: 5-20 MB covers most high-resolution photos
- **Video uploads**: 100 MB to 1 GB depending on your needs
- **General purpose**: 10-100 MB provides a good balance

### Storage quota management

Monitor your storage backend's usage to ensure you don't exceed quotas or budgets. Each file uploaded through a form counts toward your storage limit.

### Rate limiting and hardening forms

Public forms allow anonymous users to insert data directly into your database tables, which presents security and resource management challenges. Consider implementing the following measures:

#### Rate limiting

Mathesar does not include built-in rate limiting for form submissions. To protect against abuse, consider:

- **Application-level rate limiting**: Implement rate limiting at your reverse proxy (e.g., Caddy, Nginx) or application layer
- **IP-based limits**: Restrict submissions per IP address (e.g., 10 submissions per hour)
- **Form-specific limits**: Set different limits for different forms based on their sensitivity
- **Progressive delays**: Implement exponential backoff for repeated submissions

**Example Caddy rate limiting configuration:**

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

#### Database-level protections

Since forms insert data directly into your database, implement appropriate database-level safeguards:

- **Use restrictive roles**: Assign forms minimal PostgreSQL roles with only INSERT permissions (see [Associated Roles](#associated-roles) below)
- **Implement constraints**: Use database constraints, check constraints, and NOT NULL constraints to validate data
- **Monitor insert rates**: Set up database monitoring to alert on unusual insert patterns
- **Connection limits**: Configure PostgreSQL connection limits to prevent overwhelming the database

#### Form link security

Public form links are discoverable by anyone who has them. To harden forms:

- **Regenerate links regularly**: Periodically regenerate form links to invalidate old URLs
- **Restrict link sharing**: Only share form links with trusted recipients when possible
- **Monitor submissions**: Regularly review form submissions for suspicious patterns
- **Use form-specific roles**: Create dedicated roles with minimal permissions for each form

#### Data validation

Implement multiple layers of validation:

- **Database constraints**: Primary keys, foreign keys, check constraints, and NOT NULL constraints
- **Field-level validation**: Use form field rules to mark required fields
- **Data type validation**: Mathesar validates data types automatically, but ensure your schema matches your use case
- **Business logic validation**: Consider application-level validation if complex business rules are needed

#### Logging and monitoring

Set up comprehensive logging and monitoring:

- **Access logs**: Monitor form access patterns through your web server logs
- **Database logs**: Enable PostgreSQL logging to track insert operations
- **Storage monitoring**: Monitor file storage usage and access patterns
- **Alerting**: Set up alerts for unusual activity (e.g., rapid-fire submissions, large file uploads)

#### Network security

Additional network-level protections:

- **HTTPS only**: Ensure all form submissions use HTTPS to protect data in transit
- **Firewall rules**: Consider restricting form access by IP range if forms are for internal use
- **DDoS protection**: Use DDoS protection services if exposing forms to the public internet
- **Load balancing**: Distribute form submission load across multiple application instances

!!! warning "Anonymous data entry risks"
    Public forms allow anyone with the link to insert data into your database. While this is powerful, it also requires careful security considerations. Always use restrictive database roles, implement rate limiting, and monitor form activity for signs of abuse.

## Associated Roles

Each form uses an **Associated Role** setting that determines which PostgreSQL role is used when inserting records into the database.

### Understanding form roles

When a form is submitted:

1. Mathesar uses the form's associated role to insert the record
2. The role's permissions determine what operations are allowed
3. By default, forms use the `mathesar` role, which typically has broad permissions

### Security implications

The choice of associated role affects:

- **Data validation**: The role must have INSERT permissions on the base table
- **Foreign key creation**: If creating related records, the role needs INSERT permissions on related tables
- **File storage**: The role needs permissions to write to the file storage backend
- **Data access**: The role determines what data the form submission can access or modify

### Best practices for form-specific roles

Consider creating dedicated roles for forms if you want to:

- **Limit permissions**: Create a role with only the minimum permissions needed for form submissions
- **Audit form submissions**: Use role-based logging to track form activity separately
- **Control data access**: Restrict what tables or columns forms can access

**Example role creation:**

```sql
-- Create a role specifically for form submissions
CREATE ROLE form_submitter;

-- Grant INSERT permission on specific tables
GRANT INSERT ON TABLE service_requests TO form_submitter;
GRANT INSERT ON TABLE customers TO form_submitter;

-- Grant USAGE on schemas if needed
GRANT USAGE ON SCHEMA public TO form_submitter;
```

Then select this role in the form's **Associated Role** dropdown in the form editor.

### Configuring roles in forms

To change a form's associated role:

1. Open the form in the form editor
2. In the inspector panel, find the **Associated Role** section
3. Select a different role from the dropdown
4. The form will use this role for all future submissions

## Examples

### Disabling file uploads in forms

To disable file uploads entirely:

```yaml
public_form_access:
  enabled: false
```

After restarting Mathesar, public forms will no longer accept file uploads, even if your table has file columns.

### Setting reasonable upload limits

For a service request form that accepts photos:

```yaml
public_form_access:
  enabled: true
  max_upload_size: 10485760  # 10MB - sufficient for most photos
```

For a document submission form:

```yaml
public_form_access:
  enabled: true
  max_upload_size: 52428800  # 50MB - covers most documents and PDFs
```

### Different limits for different forms

The `public_form_access` setting applies globally to all forms. If you need different limits for different forms, you would need to:

1. Create separate Mathesar installations with different configurations, or
2. Implement application-level validation within your forms workflow

Currently, Mathesar does not support per-form file size limits.

## Related documentation

- [Working with forms](../user-guide/forms.md) - User guide for creating and using forms
- [File storage backend configuration](./file-backend-config.md) - Setting up file storage backends
- [PostgreSQL roles](../user-guide/roles.md) - Understanding PostgreSQL roles and permissions
