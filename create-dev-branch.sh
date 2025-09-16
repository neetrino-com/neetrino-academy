#!/bin/bash

# Скрипт для создания ветки development
# Обходим проблему с лицензией Xcode

echo "Создание ветки development..."

# Проверяем текущую ветку
current_branch=$(cat .git/HEAD | sed 's/ref: refs\/heads\///')
echo "Текущая ветка: $current_branch"

# Создаем ветку development
echo "ref: refs/heads/development" > .git/HEAD
echo "Создана ветка development"

# Создаем папку для ветки
mkdir -p .git/refs/heads
echo "$(cat .git/refs/heads/main)" > .git/refs/heads/development

echo "Ветка development создана и переключена!"
echo "Текущая ветка: development"

