# Soroka Food Backend API

Backend API для кулинарного блога Soroka Food, построенный на Node.js, Express, Prisma и PostgreSQL.

## Технологический стек

- **Node.js + Express** - веб-сервер и API
- **TypeScript** - типизация
- **Prisma** - ORM для PostgreSQL
- **PostgreSQL** - база данных
- **JWT** - аутентификация
- **Bcrypt** - хеширование паролей
- **Multer** - загрузка файлов

## Установка и настройка

### Предварительные требования

- Node.js 16+
- PostgreSQL 12+
- npm или yarn

### Шаг 1: Установка зависимостей

```bash
npm install
```

### Шаг 2: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
# Database
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/soroka-food"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=public/uploads
```

### Шаг 3: Создание базы данных

```bash
# Создайте базу данных в PostgreSQL
createdb soroka-food

# Или через psql
psql -U postgres
CREATE DATABASE "soroka-food";
```

### Шаг 4: Запуск миграций

```bash
npm run prisma:migrate
```

Prisma создаст все необходимые таблицы в базе данных.

### Шаг 5: Заполнение базы данных начальными данными

```bash
npm run prisma:seed
```

Это создаст:
- Администратора (username: `admin`, password: `admin123`)
- Категории рецептов
- Несколько примеров рецептов
- Комментарии
- Настройки сайта

### Шаг 6: Запуск сервера

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

Сервер запустится на http://localhost:3000

## Доступные скрипты

```bash
npm run dev              # Запуск в режиме разработки с hot-reload
npm run build            # Сборка TypeScript в JavaScript
npm start                # Запуск продакшен версии
npm run prisma:generate  # Генерация Prisma Client
npm run prisma:migrate   # Запуск миграций базы данных
npm run prisma:studio    # Открыть Prisma Studio (GUI для БД)
npm run prisma:seed      # Заполнить БД начальными данными
```

## API Endpoints

### Public Endpoints (без авторизации)

#### Аутентификация
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/register` - Регистрация нового пользователя
- `GET /api/auth/profile` - Получить профиль (требует токен)

#### Рецепты
- `GET /api/recipes` - Список всех опубликованных рецептов (с пагинацией)
  - Query params: `page`, `limit`
- `GET /api/recipes/:id` - Детали рецепта по ID

#### Категории
- `GET /api/categories` - Список всех категорий
- `GET /api/categories/:slug/recipes` - Рецепты по категории

#### Комментарии
- `POST /api/comments` - Создать комментарий
- `GET /api/comments/recipe/:recipeId` - Получить комментарии рецепта

#### Подписка на рассылку
- `POST /api/newsletter/subscribe` - Подписаться на рассылку
- `POST /api/newsletter/unsubscribe` - Отписаться от рассылки

### Admin Endpoints (требуют JWT токен)

Все admin endpoints требуют header: `Authorization: Bearer <token>`

#### Dashboard
- `GET /api/admin/stats` - Статистика для дашборда

#### Управление рецептами
- `GET /api/admin/recipes` - Список всех рецептов (включая черновики)
- `POST /api/admin/recipes` - Создать рецепт
- `PUT /api/admin/recipes/:id` - Обновить рецепт
- `DELETE /api/admin/recipes/:id` - Удалить рецепт

#### Управление категориями
- `POST /api/admin/categories` - Создать категорию
- `PUT /api/admin/categories/:id` - Обновить категорию
- `DELETE /api/admin/categories/:id` - Удалить категорию

#### Модерация комментариев
- `GET /api/admin/comments` - Список всех комментариев
- `PATCH /api/admin/comments/:id/status` - Изменить статус комментария
- `DELETE /api/admin/comments/:id` - Удалить комментарий

#### Подписчики рассылки
- `GET /api/admin/newsletter` - Список подписчиков
- `DELETE /api/admin/newsletter/:id` - Удалить подписчика

#### Настройки сайта
- `GET /api/admin/settings` - Получить настройки
- `PUT /api/admin/settings` - Обновить настройки

#### Загрузка файлов
- `POST /api/upload/recipe-image` - Загрузить изображение рецепта
- `POST /api/upload/step-images` - Загрузить изображения шагов (до 5)

## Структура базы данных

### Таблицы

1. **users** - Администраторы и редакторы
2. **categories** - Категории рецептов
3. **recipes** - Рецепты
4. **recipe_categories** - Связь many-to-many между рецептами и категориями
5. **comments** - Комментарии к рецептам
6. **newsletter_subscribers** - Подписчики рассылки
7. **site_settings** - Настройки сайта

## Примеры использования

### Вход в систему

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

Ответ:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@sorokafood.com",
    "role": "ADMIN"
  }
}
```

### Получение рецептов

```bash
curl http://localhost:3000/api/recipes?page=1&limit=9
```

### Создание рецепта (требует токен)

```bash
curl -X POST http://localhost:3000/api/admin/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Новый рецепт",
    "description": "Описание",
    "cookingTime": 30,
    "servings": 4,
    "status": "PUBLISHED",
    "ingredients": [...],
    "instructions": [...],
    "nutrition": {...}
  }'
```

## Разработка

### Prisma Studio

Для визуального просмотра и редактирования данных:

```bash
npm run prisma:studio
```

Откроется браузер с GUI интерфейсом для работы с БД.

### Создание новых миграций

После изменения `prisma/schema.prisma`:

```bash
npm run prisma:migrate
```

## Безопасность

- Все пароли хешируются с помощью bcrypt
- JWT токены для аутентификации
- Admin routes защищены middleware
- Валидация загружаемых файлов (тип, размер)
- CORS настроен для фронтенда

## Проблемы и решения

### Ошибка подключения к PostgreSQL

Убедитесь, что:
1. PostgreSQL запущен
2. База данных создана
3. Правильные credentials в `.env`
4. Пароль в URL правильно закодирован (# = %23)

### Prisma Client не найден

Выполните:
```bash
npm run prisma:generate
```

## Лицензия

MIT
