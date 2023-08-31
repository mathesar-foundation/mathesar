import sys
import gunicorn.app.wsgiapp as wsgi
import os
from mathesar.install import main as run_install
# This is just a simple way to supply args to gunicorn
sys.argv = [".", "config.wsgi", "--bind=0.0.0.0:8000"]
# Hack to prevent collect static when install.main() is called. We will be removing this when install.py is reworked
os.environ.setdefault("DEBUG", "true")
run_install()
print("done")
wsgi.run()
