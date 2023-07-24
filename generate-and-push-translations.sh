# Generate source strings from django code
python manage.py makemessages -l en
echo 'Generated source messages from django app'

# Push django source strings to transifex
tx push -s
echo 'Pushed django source messages'
