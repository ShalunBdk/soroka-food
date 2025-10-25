# Инструкция по настройке Backend

## Проверка PostgreSQL

### 1. Убедитесь, что PostgreSQL запущен

```bash
# Проверьте статус сервиса (Windows)
sc query postgresql-x64-17

# Если не запущен, запустите:
net start postgresql-x64-17
```

### 2. Создайте базу данных

```bash
# Через psql
"C:\Program Files\PostgreSQL\17\bin\psql" -U postgres
```

Внутри psql выполните:
```sql
CREATE DATABASE "soroka-food";
\q
```

Или через createdb:
```bash
"C:\Program Files\PostgreSQL\17\bin\createdb" -U postgres soroka-food
```

### 3. Проверьте подключение

```bash
"C:\Program Files\PostgreSQL\17\bin\psql" -U postgres -d soroka-food -c "SELECT version();"
```

## Настройка .env файла

Убедитесь, что файл `.env` содержит правильные данные:

```env
DATABASE_URL="postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/soroka-food"
```

**Важно:** Если в пароле есть специальные символы, их нужно закодировать:
- `#` → `%23`
- `@` → `%40`
- `&` → `%26`
- Пробел → `%20`

Пример:
```env
# Если пароль: Pass#123
DATABASE_URL="postgresql://postgres:Pass%23123@localhost:5432/soroka-food"
```

## Запуск миграций

После того как PostgreSQL запущен и база данных создана:

```bash
# 1. Сгенерировать Prisma Client
npm run prisma:generate

# 2. Запустить миграции
npx prisma migrate dev --name init

# 3. Заполнить данными
npm run prisma:seed
```

## Запуск сервера

```bash
# Development режим
npm run dev
```

Сервер запустится на http://localhost:3000

## Проверка API

```bash
# Health check
curl http://localhost:3000/api/health

# Логин (после seed)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

## Возможные проблемы

### Advisory Lock Timeout

Если видите ошибку `P1002: Timed out trying to acquire a postgres advisory lock`:

1. Закройте все активные подключения к БД
2. Перезапустите PostgreSQL:
   ```bash
   net stop postgresql-x64-17
   net start postgresql-x64-17
   ```
3. Попробуйте снова запустить миграцию

### Ошибка аутентификации

Если видите `Authentication failed`:

1. Проверьте пароль в `.env`
2. Убедитесь, что пользователь `postgres` существует
3. Проверьте файл `pg_hba.conf` в PostgreSQL (должно быть `md5` или `trust` для localhost)

### База данных не найдена

Если видите `Database not found`:

1. Создайте базу данных вручную (см. шаг 2 выше)
2. Проверьте правильность имени в `DATABASE_URL`
