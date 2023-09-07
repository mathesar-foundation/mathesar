import sys
import gunicorn.app.wsgiapp as wsgi
import os
from mathesar.install import main as run_install
# This is just a simple way to supply args to gunicorn
sys.argv = [".", "config.wsgi", "--bind=0.0.0.0:8000"]
run_install(skip_static_collection=True)
wsgi.run()
