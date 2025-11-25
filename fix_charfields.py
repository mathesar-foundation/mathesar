import re

# List of model files to fix
files_to_fix = [
    "mathesar/models/analytics.py",
    "mathesar/models/base.py",
    "mathesar/models/users.py"
]

for file_path in files_to_fix:
    with open(file_path, "r") as f:
        content = f.read()

    # Add max_length=255 if missing in CharField
    content_fixed = re.sub(r"CharField\((?!.*max_length)", "CharField(max_length=255, ", content)

    with open(file_path, "w") as f:
        f.write(content_fixed)

print("All CharField errors fixed!")

