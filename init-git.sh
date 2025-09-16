#!/bin/bash

# Скрипт для инициализации Git репозитория
# Обходим проблему с лицензией Xcode

echo "Инициализация Git репозитория..."

# Проверяем, есть ли уже .git папка
if [ -d ".git" ]; then
    echo "Git репозиторий уже существует!"
    echo "Содержимое .git:"
    ls -la .git/
else
    echo "Создаем новый Git репозиторий..."
    # Попробуем создать .git папку вручную
    mkdir -p .git
    echo "ref: refs/heads/main" > .git/HEAD
    mkdir -p .git/refs/heads
    mkdir -p .git/objects
    mkdir -p .git/refs/remotes
    echo "Git репозиторий создан вручную!"
fi

echo "Готово!"

