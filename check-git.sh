#!/bin/bash

# Скрипт для проверки статуса Git репозитория
# Обходим проблему с лицензией Xcode

echo "Проверка Git репозитория..."

# Проверяем текущую ветку
if [ -f ".git/HEAD" ]; then
    current_branch=$(cat .git/HEAD | sed 's/ref: refs\/heads\///')
    echo "Текущая ветка: $current_branch"
else
    echo "Не удалось определить текущую ветку"
fi

# Проверяем статус файлов
echo "Проверка статуса файлов..."
if [ -f ".git/index" ]; then
    echo "Индекс Git существует"
    echo "Размер индекса: $(ls -lh .git/index | awk '{print $5}')"
else
    echo "Индекс Git не найден"
fi

# Проверяем последний коммит
if [ -f ".git/COMMIT_EDITMSG" ]; then
    echo "Последний коммит:"
    cat .git/COMMIT_EDITMSG
else
    echo "Нет информации о последнем коммите"
fi

echo "Готово!"

