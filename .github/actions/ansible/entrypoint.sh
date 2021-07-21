#!/bin/sh

# Put the vault password in to a file
mkdir -p /tmp/private && chmod 700 /tmp/private
echo "${INPUT_VAULT_PASSWORD}" > /tmp/private/vault_password

# Put the key in to a file
echo "${INPUT_DEPLOY_KEY}" > /tmp/private/deploy_key && chmod 400 /tmp/private/deploy_key

ansible-playbook ${INPUT_PLAYBOOK}.yml \
    -i "${INPUT_INVENTORY}" \
    --vault-password-file /tmp/private/vault_password \
    --private-key /tmp/private/deploy_key \
    -u "${INPUT_DEPLOY_USER}"