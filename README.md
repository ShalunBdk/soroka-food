# Soroka Food - Кулинарный Блог

Полнофункциональное веб-приложение для кулинарного блога с админ-панелью.

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 16+
- PostgreSQL 12+
- npm

### 1️⃣ Установка всех зависимостей

```bash
# Установить зависимости для корня, frontend и backend
npm run install:all
```

### 2️⃣ Настройка базы данных

1. Убедитесь, что PostgreSQL запущен:
```bash
net start postgresql-x64-17
```

2. Создайте базу данных:
```bash
"C:\Program Files\PostgreSQL\17\bin\createdb" -U postgres soroka-food
```

3. Настройте `.env` файл в `soroka-food-backend/`:
```env
DATABASE_URL="postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/soroka-food"
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

4. Запустите миграции и seed:
```bash
npm run prisma:migrate
npm run prisma:seed
```

### 3️⃣ Запуск приложения

**Запустить frontend И backend одной командой:**

```bash
npm run dev
```

Это запустит:
- Backend API на `http://localhost:3000`
- Frontend на `http://localhost:5173`

**Или запустить раздельно:**

```bash
# Только backend
npm run dev:backend

# Только frontend
npm run dev:frontend
```

## 📋 Доступные команды

### Разработка

```bash
npm run dev              # Запустить frontend + backend одновременно
npm run dev:backend      # Запустить только backend
npm run dev:frontend     # Запустить только frontend
```

### Сборка

```bash
npm run build            # Собрать frontend + backend
npm run build:backend    # Собрать только backend
npm run build:frontend   # Собрать только frontend
```

### Production

```bash
npm start                # Запустить production версию (frontend + backend)
npm run start:backend    # Запустить только backend в production
npm run start:frontend   # Запустить только frontend preview
```

### База данных

```bash
npm run prisma:migrate   # Запустить миграции Prisma
npm run prisma:seed      # Заполнить БД начальными данными
npm run prisma:studio    # Открыть Prisma Studio (GUI для БД)
```

### Установка

```bash
npm run install:all      # Установить все зависимости (корень, frontend, backend)
```

## 🏗️ Структура проекта

```
SorokaFood/
├── soroka-food-app/          # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/       # Компоненты
│   │   ├── pages/            # Страницы
│   │   ├── types/            # TypeScript типы
│   │   └── data/             # Mock данные (будут заменены на API)
│   └── package.json
│
├── soroka-food-backend/      # Backend (Node.js + Express + Prisma)
│   ├── src/
│   │   ├── controllers/      # Контроллеры API
│   │   ├── routes/           # Маршруты
│   │   ├── middleware/       # Middleware (auth, upload, errors)
│   │   ├── config/           # Конфигурация
│   │   └── utils/            # Утилиты
│   ├── prisma/
│   │   ├── schema.prisma     # Схема БД
│   │   └── seed.ts           # Начальные данные
│   └── package.json
│
├── package.json              # Корневой package.json
└── README.md                 # Этот файл
```

## 🔑 Учетные данные по умолчанию

После запуска `npm run prisma:seed`:

- **Username:** `admin`
- **Password:** `admin123`

## 🌐 URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Health Check: http://localhost:3000/api/health

## 📚 API Endpoints

### Public API

- `GET /api/recipes` - Список рецептов
- `GET /api/recipes/:id` - Детали рецепта
- `GET /api/categories` - Категории
- `POST /api/comments` - Создать комментарий
- `POST /api/newsletter/subscribe` - Подписаться

### Admin API (требует токен)

- `POST /api/auth/login` - Вход
- `GET /api/admin/stats` - Статистика
- `GET /api/admin/recipes` - Все рецепты
- `POST /api/admin/recipes` - Создать рецепт
- `PUT /api/admin/recipes/:id` - Обновить рецепт
- `DELETE /api/admin/recipes/:id` - Удалить рецепт
- `POST /api/upload/recipe-image` - Загрузить изображение

## 🛠️ Технологический стек

### Frontend
- React 19
- TypeScript
- Vite
- React Router 7
- CSS Modules

### Backend
- Node.js
- Express 5
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT аутентификация
- Multer (загрузка файлов)
- Bcrypt (хеширование паролей)

## 📖 Дополнительная документация

- Frontend: `soroka-food-app/README.md`
- Backend: `soroka-food-backend/README.md`
- Backend Setup: `soroka-food-backend/SETUP.md`

## 🐛 Решение проблем

### PostgreSQL не запускается

```bash
# Windows
net start postgresql-x64-17
```

### Ошибка миграций Prisma

1. Закройте все подключения к БД
2. Перезапустите PostgreSQL
3. Попробуйте снова: `npm run prisma:migrate`

### Порт занят

Если порт 3000 или 5173 занят:

**Backend (порт 3000):**
Измените `PORT` в `soroka-food-backend/.env`

**Frontend (порт 5173):**
Vite автоматически выберет следующий доступный порт

## 📝 Лицензия

MIT

## 👨‍💻 Разработка

### Следующие шаги

1. ✅ Backend API готов
2. ✅ Frontend с mock данными готов
3. 🔲 Интеграция frontend с backend API
4. 🔲 Обновление admin панели для работы с реальным API
5. 🔲 Добавление поиска по рецептам
6. 🔲 Фильтрация по категориям
7. 🔲 Загрузка реальных изображений

### Как добавить новый функционал

1. **Backend:** Создать controller → route → добавить в `src/index.ts`
2. **Frontend:** Создать компонент → страницу → добавить route в `App.tsx`
3. **Интеграция:** Создать API service в `soroka-food-app/src/services/api.ts`

---

**Приятной разработки! 🍳**
