# Configuring file storage backends

!!! question "Help us refine file storage!"
    Our file storage feature is new and still evolving. We'd love to hear about how you're using it, what's working, and what additional workflows you'd like to see supported. 
	
	[Talk to us for 20 min](https://cal.com/mathesar/users)! We'll give you a $25 gift card as a thank you.

Mathesar's [File columns](../user-guide/files.md) require you to configure an **S3-compatible object storage backend**. File storage allows users to upload, preview, and download files directly within Mathesar.

**Configuring file storage and using file columns is optional.** By default, Mathesar does not expose file column controls unless a storage backend is set up. If you do not set up a backend, users will not be able to work directly with files in Mathesar.

## 1. Configure your storage backend

First, you'll need to decide which **S3-compatible object storage backend** you'll use.

Popular options include:

- [AWS S3](https://docs.aws.amazon.com/s3/)
- [Cloudflare R2](https://www.cloudflare.com/developer-platform/products/r2/)
- [DigitalOcean Spaces](https://www.digitalocean.com/products/spaces)
- [Self-hosted MinIO](https://www.min.io/)

!!! warning "MinIO license considerations"
    MinIO is licensed under the [GNU Affero General Public License v3 (AGPLv3)](https://github.com/minio/minio/blob/master/LICENSE). This license requires that if you modify MinIO and make it available over a network, you must also make your modified source code available to users.

    Be sure you understand these obligations before choosing MinIO as your storage backend. See MinIO's documentation on [license compliance](https://github.com/minio/minio/blob/master/COMPLIANCE.md#agplv3-compliance) for details.

After choosing a backend, you'll need to follow the basic steps for working with S3-comptiable object storage:

1. **Create a bucket**
    - Decide on a unique bucket name.
    - Choose which region your bucket is in (if your platform supports regions).
    - (Optional but recommended) enable versioning or lifecycle policies depending on your retention needs.
1. **Create an API key and secret key**
    - Generate credentials with **read/write permissions** scoped to your bucket.
2. **Note the endpoint URL**
    - For example, AWS uses `https://s3.[region].amazonaws.com` by default.
    - Other providers (Cloudflare R2, DigitalOcean Spaces, MinIO) each provide a specific endpoint.

### 2. Enable file storage in Mathesar

Enabling file storage requires setting up a new configuration file or environment variable that contains your backend's connection details.

You'll either create a file named `file_storage.yml` or set up the `FILE_STORAGE_DICT` environment variable. Which you choose depends on how you installed Mathesar:

=== "For Docker Compose installations"

      If you used [Docker Compose](./install-via-docker-compose.md), create the `file_storage.yml` file next to your [`docker-compose.yml` file](https://github.com/mathesar-foundation/mathesar/raw/{{mathesar_version}}/docker-compose.yml):

      ```diff
      mathesar
       ├── docker-compose.yml
       ├── msar/
      +└── file_storage.yml
      ```

      Then, uncomment the following lines in your docker compose file:

      ```diff
      volumes:
       - ./msar/static:/code/static
       - ./msar/media:/code/media
      # Uncomment the following to mount file_storage.yml and enable
      #  an S3-compliant file storage backend
      -# - ./file_storage.yml:/code/file_storage.yml
      +  - ./file_storage.yml:/code/file_storage.yml
      ```

=== "For Linux, macOS, or WSL installations"

    For [direct installations](./install-from-scratch.md), create `file_storage.yml` in the installation directory you [defined while installing](./install-from-scratch.md#set-up-your-installation-directory) Mathesar.

=== "For DigitalOcean or Railway"

    If you deployed to an environment where you can't use the local filesystem (e.g. [DigitalOcean](./install-digitalocean.md), [Railway](./install-railway.md)), you can use the `FILE_STORAGE_DICT` environment variable instead of a `file_storage.yml` file.

    This variable must contain a JSON representation of the same data that `file_storage.yml` contains, wrapped in quotes and with quotes escaped. Here's an example:

    ```env
    FILE_STORAGE_DICT="{\"default\": {\"protocol\": \"s3\", \"nickname\": \"Local object store\", \"prefix\": \"mathesar-storages\", \"kwargs\": {\"client_kwargs\": {\"endpoint_url\": \"http://mathesar-dev-store:9000\", \"region_name\": \"us-east-2\", \"aws_access_key_id\": \"mathesar\", \"aws_secret_access_key\": \"mathesar\"}}}}"
    ```

    !!! tip "See [Environment Variables](./environment-variables.md#file_storage_dict-optional) for links to tools that simplify this process."

### 3. Configure backend connection details

Here's where you populate your configuration file.

#### 3a. Retrieve needed information

From your chosen storage backend, collect the following details:

* **Bucket name**: corresponds to the `prefix` field in Mathesar's config.
* **Endpoint URL**: the base URL for your provider's S3 API.
* **Region name**: required by some providers (e.g. AWS). If your provider doesn’t use regions (e.g. Cloudflare R2), set this to `"auto"`.
* **Access key ID**: generated credential for programmatic access.
* **Secret access key**: generated credential paired with the access key ID.

#### 3b. Basic setup

Once you have those details, update `file_storage.yml` with your values:

```diff
# This config file allows you to configure an S3-compatible
# object storage backend for file columns in Mathesar.
default:
+  protocol: s3
+  nickname: "Backend name"   # A friendly label for this backend
+  prefix: my-mathesar-bucket # This should match your bucket name exactly
+  kwargs:
+    client_kwargs:
+      endpoint_url: https://s3.us-east-2.amazonaws.com
+      region_name: us-east-2
+      aws_access_key_id: YOUR_ACCESS_KEY
+      aws_secret_access_key: YOUR_SECRET_KEY
```

### 4. Activate file storage

Once you've finished configuring storage, restart Mathesar so it can load the updated `file_storage.yml` file or environment variable.

=== "For Docker Compose installations"

       ```bash
       docker compose -f docker-compose.yml down
       docker compose -f docker-compose.yml up -d
       ```

=== "For Linux, macOS, or WSL installations"

    ```bash
    sudo systemctl restart mathesar.service
    ```

=== "For DigitalOcean or Railway"

    Use their web interface to restart (often framed as a "redeploy") Mathesar.

After restarting, file columns will be enabled in your Mathesar installation. To test this, check the UI for adding a new file column.
