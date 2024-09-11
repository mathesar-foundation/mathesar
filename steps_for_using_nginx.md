> **Note:** Follow the steps defined in the DEVELOPER_GUIDE.md, before proceeding with the further steps.

## Steps to build the docker image of nginx for mathesar service is as follows (in development mode)

**docker build -f Dockerfile.nginx_local -t nginx .**

we are opening ports 443 for HTTPS and 80 for HTTP which will help redirect the requests

**docker run -d -p 443:443 -p 80:80 -e DOMAIN=localhost nginx**


Since the certs are being built on the local and not universal trusted, we need to follow extra steps of moving the root CA from docker image to development host and whitelist the same under the truststore. 

## steps to copy root CA from docker container to local host

docker cp container_id:/path/to/mkcert/rootCA.pem .

For **windows**: Use **certmgr.msc** to add the CA under **Trusted Root Certification Authorities**.

For **macOS**: Add the CA to **Keychain Access** and mark it as trusted.

For **Linux**: Copy the CA to **/usr/local/share/ca-certificates/** and **run sudo update-ca-certificates**.


## Steps to build the docker image of nginx for mathesar service is as follows (Production environment)

Generate the certs using any standard format. Once available, pls. update the Dockerfile.nginx with cert location from where they have to be copied on to docker volume and update the relative paths in the nginx.conf if you wish so. 