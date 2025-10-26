# 🚀 Production Ready План - Soroka Food

**Статус проекта**: 30% готовности к production
**Последнее обновление**: 2025-10-26

---

## 📊 Общий прогресс

- [x] **Безопасность** (10/10 задач) - ✅ Завершено
- [ ] **Инфраструктура** (0/6 задач) - 🔴 Критично
- [ ] **Производительность** (0/7 задач) - 🟡 Высокий приоритет
- [ ] **Тестирование** (0/5 задач) - 🟡 Высокий приоритет
- [ ] **Качество кода** (0/5 задач) - 🟢 Средний приоритет
- [ ] **Мониторинг** (0/4 задач) - 🟢 Средний приоритет

**Общий прогресс**: 10/37 задач (27.0%)

---

## 🔴 КРИТИЧЕСКИЙ ПРИОРИТЕТ (Неделя 1-2)

### 📅 Неделя 1: Безопасность

#### 1. Защита секретов и конфиденциальных данных

- [x] **День 1.1**: ~~Удалить `.env` из Git истории~~ (не требуется - файл не был в git)
  ```bash
  # Команды для очистки истории
  git filter-branch --force --index-filter \
    "git rm --cached --ignore-unmatch soroka-food-backend/.env" \
    --prune-empty --tag-name-filter cat -- --all

  # Или использовать BFG Repo-Cleaner (рекомендуется)
  bfg --delete-files .env
  git reflog expire --expire=now --all
  git gc --prune=now --aggressive
  ```

- [x] **День 1.2**: Создать `.env.example` без реальных данных
  ```bash
  # Backend
  cd soroka-food-backend
  cp .env .env.example
  # Вручную заменить все значения на примеры
  ```

- [x] **День 1.3**: Сгенерировать криптографически стойкий JWT_SECRET (TODO: пользователь должен сделать вручную)
  ```bash
  # Сгенерировать strong secret (64 байта)
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  # Обновить в .env
  ```

- [ ] **День 1.4**: Сменить пароль PostgreSQL в production окружении (TODO: перед деплоем)

- [x] **День 1.5**: Убрать fallback secret из `auth.ts`
  ```typescript
  // ❌ УБРАТЬ:
  const secret = process.env.JWT_SECRET || 'fallback-secret';

  // ✅ ЗАМЕНИТЬ НА:
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  ```

- [x] **День 1.6**: Убедиться что `.env` в `.gitignore`
  ```bash
  # Проверить оба .gitignore
  cat .gitignore | grep .env
  cat soroka-food-backend/.gitignore | grep .env
  ```

**Файлы для изменения**:
- `soroka-food-backend/.env` → удалить из git
- `soroka-food-backend/.env.example` → создать
- `soroka-food-backend/src/middleware/auth.ts:27` → убрать fallback

---

#### 2. Закрыть открытую регистрацию администраторов

- [x] **День 1.7**: Закомментировать/удалить публичный endpoint `/api/auth/register`
  ```typescript
  // soroka-food-backend/src/routes/authRoutes.ts
  // router.post('/register', asyncHandler(register)); // ЗАКРЫТО для production
  ```

- [ ] **День 1.8**: Создать CLI команду для создания админов (опционально)
  ```bash
  # Создать soroka-food-backend/scripts/createAdmin.ts
  npm run create-admin -- --username=admin --email=admin@example.com
  ```

**Альтернатива**: Оставить регистрацию, но добавить invite token систему

**Файлы для изменения**:
- `soroka-food-backend/src/routes/authRoutes.ts`
- `soroka-food-backend/scripts/createAdmin.ts` (новый)

---

#### 3. Настроить CORS для production

- [x] **День 2.1**: Добавить `ALLOWED_ORIGINS` в `.env`
  ```env
  # Development
  ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

  # Production (пример)
  ALLOWED_ORIGINS=https://sorokafood.com,https://www.sorokafood.com
  ```

- [x] **День 2.2**: Обновить CORS конфигурацию в `index.ts`
  ```typescript
  // soroka-food-backend/src/index.ts
  import cors from 'cors';

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  ```

**Файлы для изменения**:
- `soroka-food-backend/src/index.ts:14`
- `soroka-food-backend/.env.example`

---

#### 4. Добавить валидацию входных данных (Zod)

- [x] **День 2.3**: Установить Zod
  ```bash
  cd soroka-food-backend
  npm install zod
  ```

- [x] **День 2.4**: Создать validators для auth
  ```typescript
  // soroka-food-backend/src/validators/auth.validator.ts
  import { z } from 'zod';

  export const loginSchema = z.object({
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
    password: z.string().min(8).max(100)
  });

  export const registerSchema = z.object({
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
    email: z.string().email().max(255),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letter')
      .regex(/[0-9]/, 'Password must contain number')
  });
  ```

- [x] **День 2.5**: Создать validators для recipes
  ```typescript
  // soroka-food-backend/src/validators/recipe.validator.ts
  import { z } from 'zod';

  export const createRecipeSchema = z.object({
    title: z.string().min(3).max(255),
    description: z.string().min(10).max(1000),
    cookingTime: z.number().int().positive().max(1440), // max 24 hours
    servings: z.number().int().positive().max(100),
    ingredients: z.array(z.object({
      name: z.string().min(1),
      amount: z.string().min(1)
    })).min(1),
    instructions: z.array(z.object({
      stepNumber: z.number().int().positive(),
      text: z.string().min(1),
      images: z.array(z.string()).optional()
    })).min(1),
    categoryIds: z.array(z.number().int().positive()).optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['PUBLISHED', 'DRAFT']).default('DRAFT')
  });
  ```

- [x] **День 2.6**: Создать validation middleware
  ```typescript
  // soroka-food-backend/src/middleware/validation.ts
  import { Request, Response, NextFunction } from 'express';
  import { AnyZodObject, ZodError } from 'zod';
  import { AppError } from './errorHandler';

  export const validate = (schema: AnyZodObject) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params
        });
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const errors = error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }));
          throw new AppError('Validation failed', 400, errors);
        }
        next(error);
      }
    };
  };
  ```

- [x] **День 2.7**: Применить validators к routes
  ```typescript
  // soroka-food-backend/src/routes/authRoutes.ts
  import { validate } from '../middleware/validation';
  import { loginSchema, registerSchema } from '../validators/auth.validator';

  router.post('/login', validate(loginSchema), asyncHandler(login));
  // router.post('/register', validate(registerSchema), asyncHandler(register));
  ```

**Файлы для создания**:
- `soroka-food-backend/src/validators/auth.validator.ts`
- `soroka-food-backend/src/validators/recipe.validator.ts`
- `soroka-food-backend/src/validators/comment.validator.ts`
- `soroka-food-backend/src/middleware/validation.ts`

**Файлы для изменения**:
- Все route файлы в `soroka-food-backend/src/routes/`

---

#### 5. Rate Limiting (защита от brute-force и DDoS)

- [x] **День 3.1**: Установить express-rate-limit
  ```bash
  cd soroka-food-backend
  npm install express-rate-limit
  ```

- [x] **День 3.2**: Создать rate limiter конфигурацию
  ```typescript
  // soroka-food-backend/src/middleware/rateLimiter.ts
  import rateLimit from 'express-rate-limit';

  // Общий лимит для всех API запросов
  export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // 100 запросов на IP
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Строгий лимит для логина (защита от brute-force)
  export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 5, // 5 попыток логина
    message: 'Too many login attempts, please try again after 15 minutes',
    skipSuccessfulRequests: true, // Не считать успешные попытки
  });

  // Лимит для регистрации
  export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 3, // 3 регистрации с одного IP
    message: 'Too many accounts created from this IP',
  });

  // Лимит для загрузки файлов
  export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 50, // 50 загрузок
    message: 'Too many uploads from this IP',
  });
  ```

- [x] **День 3.3**: Применить rate limiters
  ```typescript
  // soroka-food-backend/src/index.ts
  import { apiLimiter, loginLimiter, registerLimiter, uploadLimiter } from './middleware/rateLimiter';

  // Общий лимит для всех API
  app.use('/api/', apiLimiter);

  // В authRoutes.ts
  router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(login));
  // router.post('/register', registerLimiter, validate(registerSchema), asyncHandler(register));

  // В uploadRoutes.ts
  router.post('/recipe-image', uploadLimiter, authenticateToken, requireAdmin, ...);
  ```

**Файлы для создания**:
- `soroka-food-backend/src/middleware/rateLimiter.ts`

**Файлы для изменения**:
- `soroka-food-backend/src/index.ts`
- `soroka-food-backend/src/routes/authRoutes.ts`
- `soroka-food-backend/src/routes/uploadRoutes.ts`

---

#### 6. Helmet для защиты HTTP заголовков

- [x] **День 3.4**: Установить helmet
  ```bash
  cd soroka-food-backend
  npm install helmet
  ```

- [x] **День 3.5**: Настроить helmet middleware
  ```typescript
  // soroka-food-backend/src/index.ts
  import helmet from 'helmet';

  // Применить helmet (добавить перед другими middleware)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Для загрузки внешних изображений
  }));
  ```

**Файлы для изменения**:
- `soroka-food-backend/src/index.ts` (добавить после `dotenv.config()`)

---

#### 7. Санитизация HTML (защита от XSS)

- [x] **День 4.1**: Установить DOMPurify для фронтенда
  ```bash
  cd soroka-food-app
  npm install dompurify isomorphic-dompurify
  npm install --save-dev @types/dompurify
  ```

- [x] **День 4.2**: Создать utility для санитизации
  ```typescript
  // soroka-food-app/src/utils/sanitize.ts
  import DOMPurify from 'isomorphic-dompurify';

  export const sanitizeHTML = (html: string): string => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h2', 'h3', 'ul', 'ol', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
    });
  };
  ```

- [x] **День 4.3**: Применить санитизацию к статическим страницам
  ```typescript
  // soroka-food-app/src/pages/About.tsx (и другие static pages)
  import { sanitizeHTML } from '../utils/sanitize';

  <div
    className="static-content"
    dangerouslySetInnerHTML={{ __html: sanitizeHTML(page.content) }}
  />
  ```

**Файлы для создания**:
- `soroka-food-app/src/utils/sanitize.ts`

**Файлы для изменения**:
- `soroka-food-app/src/pages/About.tsx`
- `soroka-food-app/src/pages/Contact.tsx`
- `soroka-food-app/src/pages/Rules.tsx`
- `soroka-food-app/src/pages/Advertising.tsx`

---

#### 8. Улучшенная валидация загружаемых файлов

- [x] **День 4.4**: Установить Sharp для обработки изображений
  ```bash
  cd soroka-food-backend
  npm install sharp
  npm install --save-dev @types/sharp
  ```

- [x] **День 4.5**: Создать image validation middleware
  ```typescript
  // soroka-food-backend/src/middleware/imageValidation.ts
  import sharp from 'sharp';
  import { Request, Response, NextFunction } from 'express';
  import { AppError } from './errorHandler';

  export const validateImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const file = req.file;
    if (!file) {
      return next();
    }

    try {
      // Проверка что это действительно изображение
      const metadata = await sharp(file.path).metadata();

      // Проверка размеров (например, макс 5000x5000)
      if (metadata.width && metadata.width > 5000 ||
          metadata.height && metadata.height > 5000) {
        throw new AppError('Image dimensions too large (max 5000x5000)', 400);
      }

      // Проверка формата
      const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];
      if (!metadata.format || !allowedFormats.includes(metadata.format)) {
        throw new AppError('Invalid image format', 400);
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Invalid image file', 400);
    }
  };
  ```

- [x] **День 4.6**: Добавить автоматическую оптимизацию изображений
  ```typescript
  // soroka-food-backend/src/utils/imageProcessor.ts
  import sharp from 'sharp';
  import path from 'path';

  export const optimizeImage = async (
    inputPath: string,
    outputPath: string,
    maxWidth: number = 1200
  ): Promise<string> => {
    await sharp(inputPath)
      .resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85, progressive: true })
      .toFile(outputPath);

    return outputPath;
  };
  ```

- [x] **День 4.7**: Применить валидацию к upload routes
  ```typescript
  // soroka-food-backend/src/routes/uploadRoutes.ts
  import { validateImage } from '../middleware/imageValidation';

  router.post(
    '/recipe-image',
    authenticateToken,
    requireAdmin,
    uploadSingle,
    validateImage,
    asyncHandler(uploadRecipeImage)
  );
  ```

**Файлы для создания**:
- `soroka-food-backend/src/middleware/imageValidation.ts`
- `soroka-food-backend/src/utils/imageProcessor.ts`

**Файлы для изменения**:
- `soroka-food-backend/src/routes/uploadRoutes.ts`
- `soroka-food-backend/src/controllers/uploadController.ts`

---

### 📅 Неделя 2: Инфраструктура и конфигурация

#### 9. Environment Variables для фронтенда

- [ ] **День 5.1**: Создать `.env` файлы для фронтенда
  ```bash
  cd soroka-food-app
  touch .env.development .env.production .env.example
  ```

- [ ] **День 5.2**: Настроить environment variables
  ```env
  # soroka-food-app/.env.development
  VITE_API_URL=http://localhost:3000/api
  VITE_APP_ENV=development

  # soroka-food-app/.env.production
  VITE_API_URL=https://api.yourdomain.com/api
  VITE_APP_ENV=production

  # soroka-food-app/.env.example
  VITE_API_URL=http://localhost:3000/api
  VITE_APP_ENV=development
  ```

- [ ] **День 5.3**: Обновить API client для использования env переменных
  ```typescript
  // soroka-food-app/src/services/api.ts
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  ```

- [ ] **День 5.4**: Добавить env в .gitignore
  ```gitignore
  # soroka-food-app/.gitignore
  .env
  .env.local
  .env.development
  .env.production
  ```

**Файлы для создания**:
- `soroka-food-app/.env.development`
- `soroka-food-app/.env.production`
- `soroka-food-app/.env.example`

**Файлы для изменения**:
- `soroka-food-app/src/services/api.ts:2`
- `soroka-food-app/.gitignore`

---

#### 10. Логирование (Winston)

- [ ] **День 5.5**: Установить Winston
  ```bash
  cd soroka-food-backend
  npm install winston winston-daily-rotate-file
  ```

- [ ] **День 5.6**: Создать logger конфигурацию
  ```typescript
  // soroka-food-backend/src/config/logger.ts
  import winston from 'winston';
  import DailyRotateFile from 'winston-daily-rotate-file';

  const { combine, timestamp, printf, colorize, errors } = winston.format;

  // Формат логов
  const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  });

  // Transport для ошибок
  const errorRotateTransport = new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '14d',
    maxSize: '20m',
  });

  // Transport для всех логов
  const combinedRotateTransport = new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '7d',
    maxSize: '20m',
  });

  export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
      errors({ stack: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat
    ),
    transports: [
      errorRotateTransport,
      combinedRotateTransport,
    ],
  });

  // Console в development
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      ),
    }));
  }
  ```

- [ ] **День 5.7**: Заменить console.log на logger
  ```typescript
  // soroka-food-backend/src/index.ts
  import { logger } from './config/logger';

  // ❌ УБРАТЬ:
  console.log(`🚀 Server running on http://localhost:${PORT}`);

  // ✅ ЗАМЕНИТЬ НА:
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  ```

- [ ] **День 5.8**: Добавить логирование в error handler
  ```typescript
  // soroka-food-backend/src/middleware/errorHandler.ts
  import { logger } from '../config/logger';

  export const errorHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
      logger.warn(`AppError: ${err.message}`, {
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
      });
    } else {
      logger.error('Unexpected error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });
    }
    // ... rest of error handler
  };
  ```

- [ ] **День 5.9**: Создать logs директорию
  ```bash
  mkdir soroka-food-backend/logs
  echo "*" > soroka-food-backend/logs/.gitignore
  echo "!.gitignore" >> soroka-food-backend/logs/.gitignore
  ```

**Файлы для создания**:
- `soroka-food-backend/src/config/logger.ts`
- `soroka-food-backend/logs/.gitignore`

**Файлы для изменения**:
- `soroka-food-backend/src/index.ts` (заменить console.log)
- `soroka-food-backend/src/middleware/errorHandler.ts`

---

#### 11. Docker контейнеризация

- [ ] **День 6.1**: Создать Dockerfile для backend
  ```dockerfile
  # soroka-food-backend/Dockerfile
  FROM node:20-alpine AS builder

  WORKDIR /app

  # Копировать package files
  COPY package*.json ./
  COPY prisma ./prisma/

  # Установить зависимости
  RUN npm ci

  # Копировать исходный код
  COPY . .

  # Сгенерировать Prisma Client
  RUN npx prisma generate

  # Собрать приложение
  RUN npm run build

  # Production stage
  FROM node:20-alpine

  WORKDIR /app

  # Копировать package files
  COPY package*.json ./
  COPY prisma ./prisma/

  # Установить только production зависимости
  RUN npm ci --only=production

  # Копировать built приложение
  COPY --from=builder /app/dist ./dist
  COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

  # Создать директорию для uploads
  RUN mkdir -p public/uploads

  EXPOSE 3000

  CMD ["npm", "start"]
  ```

- [ ] **День 6.2**: Создать .dockerignore
  ```dockerignore
  # soroka-food-backend/.dockerignore
  node_modules
  npm-debug.log
  .env
  .env.local
  dist
  logs
  public/uploads/*
  !public/uploads/.gitkeep
  .git
  .gitignore
  README.md
  ```

- [ ] **День 6.3**: Создать Dockerfile для frontend
  ```dockerfile
  # soroka-food-app/Dockerfile
  FROM node:20-alpine AS builder

  WORKDIR /app

  COPY package*.json ./
  RUN npm ci

  COPY . .
  RUN npm run build

  # Nginx stage для serve статики
  FROM nginx:alpine

  COPY --from=builder /app/dist /usr/share/nginx/html
  COPY nginx.conf /etc/nginx/conf.d/default.conf

  EXPOSE 80

  CMD ["nginx", "-g", "daemon off;"]
  ```

- [ ] **День 6.4**: Создать docker-compose.yml
  ```yaml
  # docker-compose.yml (в корне проекта)
  version: '3.8'

  services:
    postgres:
      image: postgres:17-alpine
      container_name: soroka-food-db
      environment:
        POSTGRES_DB: soroka-food
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: ${DB_PASSWORD}
      volumes:
        - postgres_data:/var/lib/postgresql/data
      ports:
        - "5432:5432"
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U postgres"]
        interval: 10s
        timeout: 5s
        retries: 5

    redis:
      image: redis:7-alpine
      container_name: soroka-food-redis
      ports:
        - "6379:6379"
      healthcheck:
        test: ["CMD", "redis-cli", "ping"]
        interval: 10s
        timeout: 5s
        retries: 5

    backend:
      build: ./soroka-food-backend
      container_name: soroka-food-api
      ports:
        - "3000:3000"
      environment:
        NODE_ENV: production
        DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/soroka-food
        REDIS_URL: redis://redis:6379
        JWT_SECRET: ${JWT_SECRET}
        JWT_EXPIRES_IN: 7d
        PORT: 3000
      depends_on:
        postgres:
          condition: service_healthy
        redis:
          condition: service_healthy
      volumes:
        - uploads:/app/public/uploads
        - logs:/app/logs

    frontend:
      build: ./soroka-food-app
      container_name: soroka-food-web
      ports:
        - "80:80"
      depends_on:
        - backend

  volumes:
    postgres_data:
    uploads:
    logs:
  ```

- [ ] **День 6.5**: Создать .env для docker-compose
  ```env
  # .env (в корне проекта)
  DB_PASSWORD=your_secure_password_here
  JWT_SECRET=your_jwt_secret_here
  ```

- [ ] **День 6.6**: Протестировать Docker setup
  ```bash
  # Собрать и запустить
  docker-compose up -d

  # Запустить миграции
  docker-compose exec backend npx prisma migrate deploy

  # Seed данные
  docker-compose exec backend npx prisma db seed

  # Проверить логи
  docker-compose logs -f backend
  ```

**Файлы для создания**:
- `soroka-food-backend/Dockerfile`
- `soroka-food-backend/.dockerignore`
- `soroka-food-app/Dockerfile`
- `docker-compose.yml`
- `.env` (для docker-compose)

---

#### 12. Compression middleware

- [ ] **День 6.7**: Установить compression
  ```bash
  cd soroka-food-backend
  npm install compression
  npm install --save-dev @types/compression
  ```

- [ ] **День 6.8**: Добавить compression в app
  ```typescript
  // soroka-food-backend/src/index.ts
  import compression from 'compression';

  // Добавить после helmet, перед cors
  app.use(compression());
  ```

**Файлы для изменения**:
- `soroka-food-backend/src/index.ts`

---

## 🟡 ВЫСОКИЙ ПРИОРИТЕТ (Неделя 3-4)

### 📅 Неделя 3: Производительность

#### 13. Оптимизация базы данных

- [ ] **День 7.1**: Добавить индексы в Prisma schema
  ```prisma
  // soroka-food-backend/prisma/schema.prisma

  model Recipe {
    // ... существующие поля

    @@index([status])
    @@index([createdAt])
    @@index([views])
    @@index([rating])
    @@map("recipes")
  }

  model Category {
    // ... существующие поля

    @@index([slug])
    @@map("categories")
  }

  model Comment {
    // ... существующие поля

    @@index([recipeId])
    @@index([status])
    @@index([createdAt])
    @@map("comments")
  }
  ```

- [ ] **День 7.2**: Создать миграцию для индексов
  ```bash
  cd soroka-food-backend
  npx prisma migrate dev --name add_performance_indexes
  ```

- [ ] **День 7.3**: Оптимизировать Prisma queries с include
  ```typescript
  // Пример: включать связи одним запросом вместо N+1
  const recipes = await prisma.recipe.findMany({
    include: {
      categories: {
        include: {
          category: true
        }
      },
      comments: {
        where: { status: 'APPROVED' }
      }
    }
  });
  ```

**Файлы для изменения**:
- `soroka-food-backend/prisma/schema.prisma`
- Controllers с Prisma queries

---

#### 14. Redis кеширование

- [ ] **День 7.4**: Установить ioredis
  ```bash
  cd soroka-food-backend
  npm install ioredis
  npm install --save-dev @types/ioredis
  ```

- [ ] **День 7.5**: Создать Redis client
  ```typescript
  // soroka-food-backend/src/config/redis.ts
  import Redis from 'ioredis';
  import { logger } from './logger';

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  export const redis = new Redis(redisUrl, {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redis.on('connect', () => {
    logger.info('Redis connected');
  });

  redis.on('error', (err) => {
    logger.error('Redis error:', err);
  });

  export default redis;
  ```

- [ ] **День 7.6**: Создать cache middleware
  ```typescript
  // soroka-food-backend/src/middleware/cache.ts
  import { Request, Response, NextFunction } from 'express';
  import redis from '../config/redis';
  import { logger } from '../config/logger';

  export const cacheMiddleware = (duration: number = 300) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET') {
        return next();
      }

      const key = `cache:${req.originalUrl}`;

      try {
        const cached = await redis.get(key);
        if (cached) {
          logger.debug(`Cache hit: ${key}`);
          return res.json(JSON.parse(cached));
        }
      } catch (error) {
        logger.error('Cache read error:', error);
      }

      // Перехватить оригинальный res.json
      const originalJson = res.json.bind(res);
      res.json = (data: any) => {
        redis.setex(key, duration, JSON.stringify(data)).catch((err) => {
          logger.error('Cache write error:', err);
        });
        return originalJson(data);
      };

      next();
    };
  };
  ```

- [ ] **День 7.7**: Применить кеширование к публичным routes
  ```typescript
  // soroka-food-backend/src/routes/recipeRoutes.ts
  import { cacheMiddleware } from '../middleware/cache';

  // Кешировать список рецептов на 5 минут
  router.get('/', cacheMiddleware(300), asyncHandler(getRecipes));

  // Кешировать детали рецепта на 10 минут
  router.get('/:id', cacheMiddleware(600), asyncHandler(getRecipeById));

  // Кешировать категории на 30 минут
  router.get('/categories', cacheMiddleware(1800), asyncHandler(getCategories));
  ```

- [ ] **День 7.8**: Инвалидация кеша при изменениях
  ```typescript
  // soroka-food-backend/src/utils/cacheInvalidation.ts
  import redis from '../config/redis';

  export const invalidateRecipeCache = async (recipeId?: number) => {
    const patterns = [
      'cache:/api/recipes*',
      'cache:/api/categories*',
    ];

    if (recipeId) {
      patterns.push(`cache:/api/recipes/${recipeId}`);
    }

    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  };

  // Использовать в контроллерах:
  // После создания/обновления/удаления рецепта
  await invalidateRecipeCache(recipeId);
  ```

**Файлы для создания**:
- `soroka-food-backend/src/config/redis.ts`
- `soroka-food-backend/src/middleware/cache.ts`
- `soroka-food-backend/src/utils/cacheInvalidation.ts`

**Файлы для изменения**:
- `soroka-food-backend/src/routes/recipeRoutes.ts`
- `soroka-food-backend/src/routes/categoryRoutes.ts`
- Admin controllers (для инвалидации кеша)

---

#### 15. Оптимизация изображений

- [ ] **День 8.1**: Настроить автоматический ресайз при загрузке
  ```typescript
  // soroka-food-backend/src/controllers/uploadController.ts
  import { optimizeImage } from '../utils/imageProcessor';

  export const uploadRecipeImage = async (req, res) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Оптимизировать оригинал
    const optimizedPath = await optimizeImage(
      req.file.path,
      req.file.path,
      1200
    );

    // Создать thumbnail
    const thumbnailPath = req.file.path.replace('.jpg', '_thumb.jpg');
    await optimizeImage(req.file.path, thumbnailPath, 300);

    res.json({
      url: `/uploads/${req.file.filename}`,
      thumbnail: `/uploads/${req.file.filename.replace('.jpg', '_thumb.jpg')}`
    });
  };
  ```

- [ ] **День 8.2**: Добавить WebP конвертацию
  ```typescript
  // Дополнить imageProcessor.ts
  export const convertToWebP = async (
    inputPath: string,
    quality: number = 85
  ): Promise<string> => {
    const outputPath = inputPath.replace(/\.(jpg|jpeg|png)$/, '.webp');

    await sharp(inputPath)
      .webp({ quality })
      .toFile(outputPath);

    return outputPath;
  };
  ```

**Файлы для изменения**:
- `soroka-food-backend/src/controllers/uploadController.ts`
- `soroka-food-backend/src/utils/imageProcessor.ts`

---

#### 16. HTTP кеширование (Cache-Control headers)

- [ ] **День 8.3**: Настроить кеширование статики
  ```typescript
  // soroka-food-backend/src/index.ts

  // Serve static files с кешированием
  app.use('/uploads',
    express.static(path.join(__dirname, '../public/uploads'), {
      maxAge: '1y', // Кеш на 1 год
      immutable: true,
      etag: true,
      lastModified: true,
    })
  );

  // В production - кешировать frontend статику
  if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../../soroka-food-app/dist');

    app.use(express.static(frontendPath, {
      maxAge: '1d', // HTML - 1 день
      etag: true,
    }));

    // CSS/JS с хешем - можно кешировать дольше
    app.use(/\.(js|css|woff|woff2|ttf|eot)$/,
      express.static(frontendPath, {
        maxAge: '1y',
        immutable: true,
      })
    );
  }
  ```

**Файлы для изменения**:
- `soroka-food-backend/src/index.ts`

---

#### 17. Pagination для комментариев

- [ ] **День 8.4**: Добавить pagination к комментариям
  ```typescript
  // soroka-food-backend/src/controllers/commentController.ts
  export const getCommentsByRecipe = async (req, res) => {
    const { recipeId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          recipeId: parseInt(recipeId),
          status: 'APPROVED'
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.comment.count({
        where: {
          recipeId: parseInt(recipeId),
          status: 'APPROVED'
        }
      })
    ]);

    res.json({
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  };
  ```

**Файлы для изменения**:
- `soroka-food-backend/src/controllers/commentController.ts`
- `soroka-food-app/src/pages/RecipeDetail.tsx` (добавить пагинацию комментариев)

---

### 📅 Неделя 4: Тестирование

#### 18. Backend тестирование

- [ ] **День 9.1**: Установить Jest и Supertest
  ```bash
  cd soroka-food-backend
  npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
  ```

- [ ] **День 9.2**: Настроить Jest
  ```javascript
  // soroka-food-backend/jest.config.js
  module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/**/*.d.ts',
      '!src/index.ts',
    ],
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  };
  ```

- [ ] **День 9.3**: Создать тестовую БД конфигурацию
  ```env
  # soroka-food-backend/.env.test
  DATABASE_URL="postgresql://postgres:password@localhost:5432/soroka-food-test"
  JWT_SECRET="test-secret-key"
  NODE_ENV="test"
  ```

- [ ] **День 9.4**: Написать unit тесты для utils
  ```typescript
  // soroka-food-backend/tests/unit/password.test.ts
  import { hashPassword, comparePassword } from '../../src/utils/password';

  describe('Password Utils', () => {
    it('should hash password', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should compare password correctly', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      const isValid = await comparePassword(password, hashed);
      expect(isValid).toBe(true);
    });
  });
  ```

- [ ] **День 9.5**: Написать integration тесты для auth
  ```typescript
  // soroka-food-backend/tests/integration/auth.test.ts
  import request from 'supertest';
  import app from '../../src/index';
  import prisma from '../../src/config/database';

  describe('Auth API', () => {
    beforeAll(async () => {
      // Setup test database
    });

    afterAll(async () => {
      await prisma.$disconnect();
    });

    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'admin',
            password: 'admin123'
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
      });

      it('should reject invalid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'admin',
            password: 'wrongpassword'
          });

        expect(response.status).toBe(401);
      });
    });
  });
  ```

- [ ] **День 9.6**: Добавить npm script для тестов
  ```json
  // soroka-food-backend/package.json
  {
    "scripts": {
      "test": "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage"
    }
  }
  ```

**Файлы для создания**:
- `soroka-food-backend/jest.config.js`
- `soroka-food-backend/.env.test`
- `soroka-food-backend/tests/unit/password.test.ts`
- `soroka-food-backend/tests/unit/jwt.test.ts`
- `soroka-food-backend/tests/integration/auth.test.ts`
- `soroka-food-backend/tests/integration/recipes.test.ts`

---

#### 19. Frontend тестирование

- [ ] **День 10.1**: Установить Vitest и Testing Library
  ```bash
  cd soroka-food-app
  npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
  ```

- [ ] **День 10.2**: Настроить Vitest
  ```typescript
  // soroka-food-app/vitest.config.ts
  import { defineConfig } from 'vitest/config';
  import react from '@vitejs/plugin-react';

  export default defineConfig({
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/tests/setup.ts',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        exclude: [
          'node_modules/',
          'src/tests/',
        ],
      },
    },
  });
  ```

- [ ] **День 10.3**: Создать setup файл
  ```typescript
  // soroka-food-app/src/tests/setup.ts
  import { expect, afterEach } from 'vitest';
  import { cleanup } from '@testing-library/react';
  import '@testing-library/jest-dom';

  afterEach(() => {
    cleanup();
  });
  ```

- [ ] **День 10.4**: Написать тесты для компонентов
  ```typescript
  // soroka-food-app/src/components/Header/Header.test.tsx
  import { render, screen } from '@testing-library/react';
  import { BrowserRouter } from 'react-router-dom';
  import { describe, it, expect } from 'vitest';
  import Header from './Header';

  describe('Header Component', () => {
    it('should render site logo', () => {
      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      );

      expect(screen.getByAltText(/logo/i)).toBeInTheDocument();
    });
  });
  ```

- [ ] **День 10.5**: Добавить npm script
  ```json
  // soroka-food-app/package.json
  {
    "scripts": {
      "test": "vitest",
      "test:ui": "vitest --ui",
      "test:coverage": "vitest --coverage"
    }
  }
  ```

**Файлы для создания**:
- `soroka-food-app/vitest.config.ts`
- `soroka-food-app/src/tests/setup.ts`
- `soroka-food-app/src/components/Header/Header.test.tsx`
- Тесты для других компонентов

---

#### 20. CI/CD Pipeline

- [ ] **День 10.6**: Создать GitHub Actions workflow
  ```yaml
  # .github/workflows/ci.yml
  name: CI/CD Pipeline

  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main]

  jobs:
    test-backend:
      runs-on: ubuntu-latest
      services:
        postgres:
          image: postgres:17
          env:
            POSTGRES_PASSWORD: postgres
            POSTGRES_DB: soroka-food-test
          options: >-
            --health-cmd pg_isready
            --health-interval 10s
            --health-timeout 5s
            --health-retries 5
          ports:
            - 5432:5432

      steps:
        - uses: actions/checkout@v3

        - name: Setup Node.js
          uses: actions/setup-node@v3
          with:
            node-version: '20'
            cache: 'npm'
            cache-dependency-path: soroka-food-backend/package-lock.json

        - name: Install dependencies
          run: |
            cd soroka-food-backend
            npm ci

        - name: Run Prisma migrations
          run: |
            cd soroka-food-backend
            npx prisma migrate deploy
          env:
            DATABASE_URL: postgresql://postgres:postgres@localhost:5432/soroka-food-test

        - name: Run tests
          run: |
            cd soroka-food-backend
            npm test
          env:
            DATABASE_URL: postgresql://postgres:postgres@localhost:5432/soroka-food-test
            JWT_SECRET: test-secret

    test-frontend:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3

        - name: Setup Node.js
          uses: actions/setup-node@v3
          with:
            node-version: '20'
            cache: 'npm'
            cache-dependency-path: soroka-food-app/package-lock.json

        - name: Install dependencies
          run: |
            cd soroka-food-app
            npm ci

        - name: Run linter
          run: |
            cd soroka-food-app
            npm run lint

        - name: Run tests
          run: |
            cd soroka-food-app
            npm run test

    build:
      needs: [test-backend, test-frontend]
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3

        - name: Setup Node.js
          uses: actions/setup-node@v3
          with:
            node-version: '20'

        - name: Install all dependencies
          run: npm run install:all

        - name: Build project
          run: npm run build

        - name: Upload build artifacts
          uses: actions/upload-artifact@v3
          with:
            name: build
            path: |
              soroka-food-backend/dist
              soroka-food-app/dist
  ```

**Файлы для создания**:
- `.github/workflows/ci.yml`

---

## 🟢 СРЕДНИЙ ПРИОРИТЕТ (Неделя 5-6)

### 21. Фикс TypeScript типов

- [ ] **День 11.1**: Исправить все `any` типы в CategoryPage.tsx
- [ ] **День 11.2**: Исправить все `any` типы в CuisinePage.tsx
- [ ] **День 11.3**: Исправить все `any` типы в RecipeDetail.tsx
- [ ] **День 11.4**: Исправить все `any` типы в SearchResults.tsx
- [ ] **День 11.5**: Исправить все `any` типы в admin компонентах
- [ ] **День 11.6**: Запустить `npm run lint` без ошибок

**Файлы для изменения**:
- `soroka-food-app/src/pages/CategoryPage.tsx:61`
- `soroka-food-app/src/pages/CuisinePage.tsx:59`
- `soroka-food-app/src/pages/RecipeDetail.tsx:17,42`
- `soroka-food-app/src/pages/SearchResults.tsx:54`
- `soroka-food-app/src/pages/admin/AdminCategories.tsx:6`
- `soroka-food-app/src/pages/admin/AdminComments.tsx:7,21`

---

### 22. Мониторинг и Error Tracking

- [ ] **День 11.7**: Установить Sentry
  ```bash
  cd soroka-food-backend
  npm install @sentry/node @sentry/integrations

  cd ../soroka-food-app
  npm install @sentry/react @sentry/vite-plugin
  ```

- [ ] **День 12.1**: Настроить Sentry для backend
  ```typescript
  // soroka-food-backend/src/config/sentry.ts
  import * as Sentry from '@sentry/node';

  export const initSentry = () => {
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1,
      });
    }
  };

  // В index.ts
  import { initSentry } from './config/sentry';
  initSentry();
  ```

- [ ] **День 12.2**: Настроить Sentry для frontend
  ```typescript
  // soroka-food-app/src/main.tsx
  import * as Sentry from '@sentry/react';

  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay(),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
  ```

- [ ] **День 12.3**: Настроить health check endpoint
  ```typescript
  // soroka-food-backend/src/routes/healthRoutes.ts
  import { Router } from 'express';
  import prisma from '../config/database';
  import redis from '../config/redis';

  const router = Router();

  router.get('/health', async (req, res) => {
    const health = {
      uptime: process.uptime(),
      timestamp: Date.now(),
      status: 'ok',
      services: {
        database: 'down',
        redis: 'down',
      }
    };

    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = 'up';
    } catch (error) {
      health.status = 'degraded';
    }

    try {
      await redis.ping();
      health.services.redis = 'up';
    } catch (error) {
      health.status = 'degraded';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  });

  export default router;
  ```

- [ ] **День 12.4**: Настроить uptime monitoring (UptimeRobot / Pingdom)

**Файлы для создания**:
- `soroka-food-backend/src/config/sentry.ts`
- `soroka-food-backend/src/routes/healthRoutes.ts`

---

### 23. API документация (Swagger)

- [ ] **День 12.5**: Установить Swagger
  ```bash
  cd soroka-food-backend
  npm install swagger-ui-express swagger-jsdoc
  npm install --save-dev @types/swagger-ui-express @types/swagger-jsdoc
  ```

- [ ] **День 12.6**: Настроить Swagger
  ```typescript
  // soroka-food-backend/src/config/swagger.ts
  import swaggerJSDoc from 'swagger-jsdoc';

  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Soroka Food API',
        version: '1.0.0',
        description: 'REST API for Soroka Food culinary blog',
      },
      servers: [
        {
          url: 'http://localhost:3000/api',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    apis: ['./src/routes/*.ts'], // Путь к файлам с комментариями
  };

  export const swaggerSpec = swaggerJSDoc(options);
  ```

- [ ] **День 12.7**: Добавить Swagger UI в app
  ```typescript
  // soroka-food-backend/src/index.ts
  import swaggerUi from 'swagger-ui-express';
  import { swaggerSpec } from './config/swagger';

  // Swagger docs (только в dev)
  if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }
  ```

- [ ] **День 13.1**: Добавить JSDoc комментарии к endpoints
  ```typescript
  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *                 user:
   *                   type: object
   */
  router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(login));
  ```

**Файлы для создания**:
- `soroka-food-backend/src/config/swagger.ts`

**Файлы для изменения**:
- Все route файлы (добавить JSDoc комментарии)

---

### 24. Database Backups

- [ ] **День 13.2**: Создать backup script
  ```bash
  # soroka-food-backend/scripts/backup-db.sh
  #!/bin/bash

  BACKUP_DIR="/backups/soroka-food"
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql"

  mkdir -p ${BACKUP_DIR}

  # Backup database
  pg_dump $DATABASE_URL > ${BACKUP_FILE}

  # Compress
  gzip ${BACKUP_FILE}

  # Delete backups older than 30 days
  find ${BACKUP_DIR} -type f -mtime +30 -delete

  echo "Backup completed: ${BACKUP_FILE}.gz"
  ```

- [ ] **День 13.3**: Настроить cron job для автоматических бэкапов
  ```bash
  # Добавить в crontab
  # Backup каждый день в 2:00 AM
  0 2 * * * /path/to/soroka-food-backend/scripts/backup-db.sh
  ```

- [ ] **День 13.4**: Создать restore script
  ```bash
  # soroka-food-backend/scripts/restore-db.sh
  #!/bin/bash

  if [ -z "$1" ]; then
    echo "Usage: ./restore-db.sh <backup-file>"
    exit 1
  fi

  BACKUP_FILE=$1

  # Decompress if needed
  if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c ${BACKUP_FILE} | psql $DATABASE_URL
  else
    psql $DATABASE_URL < ${BACKUP_FILE}
  fi

  echo "Restore completed from: ${BACKUP_FILE}"
  ```

**Файлы для создания**:
- `soroka-food-backend/scripts/backup-db.sh`
- `soroka-food-backend/scripts/restore-db.sh`

---

## 🔵 НИЗКИЙ ПРИОРИТЕТ (Будущие улучшения)

### 25. Advanced Features (опционально)

- [ ] Elasticsearch для улучшенного поиска
- [ ] WebSocket для real-time комментариев
- [ ] Email уведомления (Nodemailer)
  - Подтверждение email для newsletter
  - Уведомления админам о новых комментариях
- [ ] Social authentication (Google, Facebook OAuth)
- [ ] Multi-language support (i18n)
- [ ] PWA (Progressive Web App)
- [ ] Admin analytics dashboard
  - График посещаемости
  - Популярные рецепты за период
  - Статистика по категориям
- [ ] Recipe import/export (JSON, PDF)
- [ ] Печатная версия рецептов
- [ ] Sharing на social media (Open Graph)

---

## 📋 PRODUCTION DEPLOYMENT CHECKLIST

### Pre-deployment

- [ ] Все критичные задачи завершены
- [ ] .env файлы не в git
- [ ] Все секреты в environment variables
- [ ] CORS настроен на production домен
- [ ] Rate limiting работает
- [ ] Helmet middleware активен
- [ ] Валидация всех inputs (Zod)
- [ ] XSS санитизация (DOMPurify)
- [ ] Регистрация закрыта/защищена
- [ ] Логирование настроено (Winston)
- [ ] Error tracking настроен (Sentry)
- [ ] Database индексы созданы
- [ ] Redis кеширование работает
- [ ] Compression включен
- [ ] Изображения оптимизируются
- [ ] Health check endpoint работает
- [ ] Тесты написаны и проходят (>70% coverage)
- [ ] Build без ошибок и warnings
- [ ] Docker образы собираются
- [ ] Nginx конфигурация готова
- [ ] SSL сертификат получен (Let's Encrypt)
- [ ] Database backup настроен
- [ ] Мониторинг настроен (UptimeRobot)
- [ ] API документация актуальна

### Deployment

- [ ] Deploy на staging окружение
- [ ] Smoke tests на staging
- [ ] Performance testing (Lighthouse > 90)
- [ ] Security scan (OWASP ZAP)
- [ ] Load testing (k6 / Artillery)
- [ ] Deploy на production
- [ ] Verify health check
- [ ] Check logs за первый час
- [ ] Monitor error rate в Sentry

### Post-deployment

- [ ] Uptime monitoring активен
- [ ] Backup strategy проверена (test restore)
- [ ] Alerts настроены (email/Slack)
- [ ] Performance metrics в норме
- [ ] User acceptance testing
- [ ] Documentation обновлена

---

## 📊 ПРОГРЕСС ТРЕКИНГ

### Неделя 1 (Безопасность)
**Прогресс**: 8/8 задач ✅ ЗАВЕРШЕНО

- Защита секретов: ✅
- Закрыть регистрацию: ✅
- CORS: ✅
- Валидация (Zod): ✅
- Rate Limiting: ✅
- Helmet: ✅
- Санитизация HTML: ✅
- Валидация файлов: ✅

### Неделя 2 (Инфраструктура)
**Прогресс**: 0/4 задачи

- Environment Variables: ☐
- Логирование: ☐
- Docker: ☐
- Compression: ☐

### Неделя 3 (Производительность)
**Прогресс**: 0/5 задач

- DB индексы: ☐
- Redis кеш: ☐
- Оптимизация изображений: ☐
- HTTP кеш: ☐
- Pagination комментариев: ☐

### Неделя 4 (Тестирование)
**Прогресс**: 0/3 задачи

- Backend тесты: ☐
- Frontend тесты: ☐
- CI/CD: ☐

### Неделя 5-6 (Качество)
**Прогресс**: 0/4 задачи

- Фикс TypeScript: ☐
- Sentry: ☐
- Swagger: ☐
- Backups: ☐

---

## 🎯 MILESTONE CHECKLIST

### MVP Production Ready (5-7 дней)
- [ ] Задачи 1-6 (Безопасность)
- [ ] Задача 9 (Environment variables)
- [ ] Задача 12 (Compression)
- [ ] Задача 22 (Health check)
- [ ] Deploy setup (Docker + Nginx)

### Full Production Ready (4-6 недель)
- [ ] Все критичные задачи (Неделя 1-2)
- [ ] Все высокоприоритетные задачи (Неделя 3-4)
- [ ] Минимум 70% test coverage
- [ ] Все среднеприоритетные задачи (Неделя 5-6)

---

## 📝 NOTES

**Последнее изменение**: 2025-10-26

**Следующий шаг**: Продолжить с задачи #9 (Environment Variables для фронтенда) - Неделя 2: Инфраструктура

**Важные ссылки**:
- Production domain: TBD
- Sentry project: TBD
- Docker registry: TBD

**Team**:
- Backend: [Ваше имя]
- Frontend: [Ваше имя]
- DevOps: [Ваше имя]

---

*Этот план можно редактировать по мере выполнения задач. Отмечайте выполненные пункты галочками ✓*
