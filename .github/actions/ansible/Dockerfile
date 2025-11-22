FROM quay.io/ansible/ansible-runner:stable-2.11-latest

# Required addons that don't come by default
RUN ansible-galaxy collection install ansible.posix -p /usr/share/ansible/collections \
    && ansible-galaxy collection install community.general -p /usr/share/ansible/collections \
    && ansible-galaxy collection install community.postgresql -p /usr/share/ansible/collections

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]