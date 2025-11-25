#!/bin/bash
# Check key Django files and system

FILES=("mathesar/urls.py" "mathesar/views.py" "config/urls.py")

for f in "${FILES[@]}"; do
    if [ -f "$f" ]; then
        echo -e "\e[32m✅ $f exists\e[0m"
    else
        echo -e "\e[31m❌ $f missing\e[0m"
        continue
    fi

    if [ -s "$f" ]; then
        echo -e "   \e[32m✅ Has content\e[0m"
    else
        echo -e "   \e[33m⚠ File empty\e[0m"
    fi

    if grep -q "urlpatterns" "$f"; then
        echo -e "   \e[32m✅ urlpatterns found\e[0m"
    else
        echo -e "   \e[33m⚠ urlpatterns missing\e[0m"
    fi
done

echo -e "\n\e[34mRunning Django system check...\e[0m"
python manage.py check --deploy
