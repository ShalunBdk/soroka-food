import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const hashedPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@sorokafood.com',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });
  console.log('✅ Admin user created:', admin.username);

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'breakfast' },
      update: {},
      create: {
        name: 'Завтраки',
        slug: 'breakfast',
        description: 'Рецепты для утреннего приема пищи'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'soups' },
      update: {},
      create: {
        name: 'Супы',
        slug: 'soups',
        description: 'Первые блюда'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'main-courses' },
      update: {},
      create: {
        name: 'Вторые блюда',
        slug: 'main-courses',
        description: 'Основные блюда'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'salads' },
      update: {},
      create: {
        name: 'Салаты',
        slug: 'salads',
        description: 'Свежие салаты'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'desserts' },
      update: {},
      create: {
        name: 'Десерты',
        slug: 'desserts',
        description: 'Сладкие блюда'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'baking' },
      update: {},
      create: {
        name: 'Выпечка',
        slug: 'baking',
        description: 'Хлеб, пироги, торты'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'preserves' },
      update: {},
      create: {
        name: 'Заготовки',
        slug: 'preserves',
        description: 'Консервация и маринады'
      }
    })
  ]);
  console.log('✅ Categories created:', categories.length);

  // Find categories for recipes
  const mainCoursesCat = categories.find(c => c.slug === 'main-courses')!;
  const soupsCat = categories.find(c => c.slug === 'soups')!;
  const bakingCat = categories.find(c => c.slug === 'baking')!;
  const dessertsCat = categories.find(c => c.slug === 'desserts')!;
  const preservesCat = categories.find(c => c.slug === 'preserves')!;
  const saladsCat = categories.find(c => c.slug === 'salads')!;
  const breakfastCat = categories.find(c => c.slug === 'breakfast')!;

  // Create sample recipes
  const recipe1 = await prisma.recipe.create({
    data: {
      title: 'Тушёная капуста с мясным фаршем',
      description: 'Простой рецепт ужина из капусты и фарша — бюджетно, быстро и очень вкусно',
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23deb887' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='20' fill='%23fff'%3EТушёная капуста%3C/text%3E%3C/svg%3E",
      cookingTime: 35,
      calories: 228,
      servings: 4,
      author: 'Soroka',
      views: 1245,
      rating: 5.0,
      tags: ['Обед', 'Ужин', 'Бюджетно', 'Быстро'],
      status: 'PUBLISHED',
      ingredients: [
        { name: 'Мясной фарш (говяжий)', amount: '500 г' },
        { name: 'Белокочанная капуста', amount: '800 г' },
        { name: 'Репчатый лук', amount: '100 г' },
        { name: 'Морковь', amount: '150 г' },
        { name: 'Оливковое масло', amount: '1 ст. л.' },
        { name: 'Томатная паста', amount: '2 ст. л.' },
        { name: 'Вода', amount: '200 мл' },
        { name: 'Соль, перец, специи', amount: 'по вкусу' }
      ],
      instructions: [
        {
          stepNumber: 1,
          text: 'Разогреть сковороду с маслом и обжарить лук до мягкости и прозрачности. Добавить морковь и готовить 3-4 минуты, периодически помешивая.'
        },
        {
          stepNumber: 2,
          text: 'Добавить фарш, разбить комочки и обжарить до готовности, не забывая перемешивать. Фарш должен стать равномерно коричневым.'
        },
        {
          stepNumber: 3,
          text: 'Добавить капусту, воду, томатную пасту, соль и специи. Перемешать, накрыть крышкой и тушить 20 минут до мягкости капусты.'
        },
        {
          stepNumber: 4,
          text: 'Попробовать, при необходимости отрегулировать вкус солью и специями. Блюдо готово! Подавать горячим.'
        }
      ],
      nutrition: {
        calories: 228,
        protein: 22,
        fat: 14,
        carbs: 15
      },
      tips: [
        'Чтобы фарш не слёз в комки, важно хорошо его разбить на этапе обжарки',
        'Если у вас тугая капуста, можно сначала её обдать кипятком перед тушением',
        'Если захотите добавить больше овощей — отлично подойдут болгарский перец и помидоры'
      ],
      categories: {
        create: [
          { categoryId: mainCoursesCat.id }
        ]
      }
    }
  });
  console.log('✅ Created recipe:', recipe1.title);

  const recipe2 = await prisma.recipe.create({
    data: {
      title: 'Румынская чорба с фрикадельками',
      description: 'Нежный и ароматный суп по-румынски — чорба с фрикадельками и лёгкой кислинкой',
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23cd5c5c' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='20' fill='%23fff'%3EРумынская чорба%3C/text%3E%3C/svg%3E",
      cookingTime: 50,
      calories: 180,
      servings: 4,
      author: 'Soroka',
      views: 890,
      rating: 4.8,
      tags: ['Обед', 'Супы'],
      status: 'PUBLISHED',
      ingredients: [],
      instructions: [],
      nutrition: { calories: 180, protein: 15, fat: 8, carbs: 12 },
      tips: [],
      categories: {
        create: [{ categoryId: soupsCat.id }]
      }
    }
  });
  console.log('✅ Created recipe:', recipe2.title);

  const recipe3 = await prisma.recipe.create({
    data: {
      title: 'Банановые маффины со сметаной',
      description: 'Без масла, без миксера, и при этом с пышной, но мягкой текстурой',
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f4a460' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='20' fill='%23fff'%3EБанановые маффины%3C/text%3E%3C/svg%3E",
      cookingTime: 45,
      calories: 250,
      servings: 6,
      author: 'Soroka',
      views: 1523,
      rating: 4.9,
      tags: ['Завтрак', 'Десерт'],
      status: 'PUBLISHED',
      ingredients: [],
      instructions: [],
      nutrition: { calories: 250, protein: 4, fat: 8, carbs: 38 },
      tips: [],
      categories: {
        create: [
          { categoryId: bakingCat.id },
          { categoryId: dessertsCat.id }
        ]
      }
    }
  });
  console.log('✅ Created recipe:', recipe3.title);

  // Add sample comments for recipe1
  await prisma.comment.createMany({
    data: [
      {
        recipeId: recipe1.id,
        author: 'Мария Петрова',
        email: 'maria@example.com',
        rating: 5,
        text: 'Потрясающий рецепт! Готовила вчера на ужин, вся семья была в восторге. Капуста получилась нежная, а фарш очень ароматный.',
        status: 'APPROVED'
      },
      {
        recipeId: recipe1.id,
        author: 'Александр К.',
        email: 'alex@example.com',
        rating: 5,
        text: 'Делал по этому рецепту, добавил немного болгарского перца - получилось еще вкуснее!',
        status: 'APPROVED'
      },
      {
        recipeId: recipe1.id,
        author: 'Екатерина',
        email: 'kate@example.com',
        rating: 4,
        text: 'Хороший базовый рецепт. Я добавила немного чеснока и паприки - вышло отлично.',
        status: 'APPROVED'
      }
    ]
  });
  console.log('✅ Created comments for recipe:', recipe1.title);

  // Create site settings
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      siteName: 'Soroka Food',
      siteDescription: 'Кулинарный блог с вкусными и простыми рецептами',
      metaTitle: 'Soroka Food - Вкусные рецепты на каждый день',
      metaDescription: 'Простые и вкусные рецепты от Soroka Food. Супы, вторые блюда, десерты и многое другое.'
    }
  });
  console.log('✅ Site settings created');

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
