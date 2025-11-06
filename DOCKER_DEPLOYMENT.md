# Docker Deployment Guide

## Проблема с установкой Prisma

Если при сборке возникает ошибка `ECONNRESET` во время установки `@prisma/engines`, это связано с проблемами сети при скачивании бинарных файлов Prisma.

## Исправления

1. **Увеличены таймауты npm** - настроены retry и timeouts для npm
2. **Добавлена retry логика** - npm ci выполняется до 3 раз при неудаче
3. **PRISMA_SKIP_POSTINSTALL_GENERATE** - отключает автоматическую генерацию при установке, генерация происходит отдельным шагом
4. **Установлен OpenSSL** - необходимая зависимость для Prisma в Alpine Linux

## Альтернативное решение (если проблема остается)

Если проблема с сетью сохраняется, можно собрать образы локально и загрузить на сервер:

```bash
# На локальной машине (с хорошим интернетом)
docker-compose build
docker save soroka-food-backend -o backend.tar
docker save soroka-food-frontend -o frontend.tar

# Загрузить .tar файлы на сервер

# На сервере
docker load -i backend.tar
docker load -i frontend.tar
docker-compose up -d
```

## Рекомендации для Ubuntu Server

1. **Увеличить память для Docker** (если сборка падает с OOM):
```bash
# Создать/отредактировать /etc/docker/daemon.json
{
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}
sudo systemctl restart docker
```

2. **Использовать BuildKit** для кэширования:
```bash
export DOCKER_BUILDKIT=1
docker-compose build
```

3. **Собирать сервисы по отдельности** (если не хватает памяти):
```bash
docker-compose build postgres redis
docker-compose up -d postgres redis
docker-compose build backend
docker-compose build frontend
docker-compose up -d
```
