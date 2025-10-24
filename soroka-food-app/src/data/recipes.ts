import type { Recipe, RecipeDetail, Comment } from '../types/index';

export const recipes: Recipe[] = [
  {
    id: 1,
    title: 'Тушёная капуста с мясным фаршем',
    description: 'Простой рецепт ужина из капусты и фарша — бюджетно, быстро и очень вкусно',
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23deb887' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='20' fill='%23fff'%3EТушёная капуста%3C/text%3E%3C/svg%3E",
    cookingTime: 35,
    calories: 228,
    servings: 4,
    author: 'Soroka',
    date: '15.10.2024',
    views: 1245,
    rating: 5.0,
    category: ['Вторые блюда', 'Ужин'],
    tags: ['Обед', 'Ужин', 'Бюджетно', 'Быстро']
  },
  {
    id: 2,
    title: 'Румынская чорба с фрикадельками',
    description: 'Нежный и ароматный суп по-румынски — чорба с фрикадельками и лёгкой кислинкой',
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23cd5c5c' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='20' fill='%23fff'%3EРумынская чорба%3C/text%3E%3C/svg%3E",
    cookingTime: 50,
    calories: 180,
    servings: 4,
    author: 'Soroka',
    date: '14.10.2024',
    views: 890,
    rating: 4.8,
    category: ['Супы'],
    tags: ['Обед', 'Супы']
  },
  {
    id: 3,
    title: 'Банановые маффины со сметаной',
    description: 'Без масла, без миксера, и при этом с пышной, но мягкой текстурой',
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f4a460' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='20' fill='%23fff'%3EБанановые маффины%3C/text%3E%3C/svg%3E",
    cookingTime: 45,
    calories: 250,
    servings: 6,
    author: 'Soroka',
    date: '13.10.2024',
    views: 1523,
    rating: 4.9,
    category: ['Выпечка', 'Десерты'],
    tags: ['Завтрак', 'Десерт']
  },
  {
    id: 4,
    title: 'Маринованные помидоры за 2-4 часа',
    description: 'На вкус — как консервированные, но готовятся намного проще и быстрее',
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ff6347' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='20' fill='%23fff'%3EМаринованные помидоры%3C/text%3E%3C/svg%3E",
    cookingTime: 240,
    calories: 45,
    servings: 4,
    author: 'Soroka',
    date: '12.10.2024',
    views: 678,
    rating: 4.7,
    category: ['Заготовки'],
    tags: ['Заготовки', 'Закуски']
  },
  {
    id: 5,
    title: 'Салат Цезарь с курицей',
    description: 'Классический рецепт популярного салата с хрустящими сухариками',
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%2398fb98' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='20' fill='%23fff'%3EСалат Цезарь%3C/text%3E%3C/svg%3E",
    cookingTime: 25,
    calories: 320,
    servings: 2,
    author: 'Soroka',
    date: '11.10.2024',
    views: 2145,
    rating: 4.9,
    category: ['Салаты'],
    tags: ['Обед', 'Ужин']
  },
  {
    id: 6,
    title: 'Борщ украинский классический',
    description: 'Традиционный рецепт наваристого борща со свеклой и мясом',
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ffa07a' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='20' fill='%23fff'%3EБорщ украинский%3C/text%3E%3C/svg%3E",
    cookingTime: 90,
    calories: 195,
    servings: 6,
    author: 'Soroka',
    date: '10.10.2024',
    views: 3421,
    rating: 5.0,
    category: ['Супы'],
    tags: ['Обед', 'Супы']
  },
  {
    id: 7,
    title: 'Шарлотка с яблоками',
    description: 'Простой пирог с яблоками, который получается у всех с первого раза',
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23d2691e' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='20' fill='%23fff'%3EШарлотка%3C/text%3E%3C/svg%3E",
    cookingTime: 60,
    calories: 210,
    servings: 8,
    author: 'Soroka',
    date: '09.10.2024',
    views: 4523,
    rating: 4.8,
    category: ['Выпечка'],
    tags: ['Десерт', 'Выпечка']
  },
  {
    id: 8,
    title: 'Солянка мясная сборная',
    description: 'Густой наваристый суп с копчёностями и маслинами',
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23808000' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='20' fill='%23fff'%3EСолянка%3C/text%3E%3C/svg%3E",
    cookingTime: 70,
    calories: 240,
    servings: 4,
    author: 'Soroka',
    date: '08.10.2024',
    views: 1876,
    rating: 4.7,
    category: ['Супы'],
    tags: ['Обед', 'Супы']
  },
  {
    id: 9,
    title: 'Блины на молоке тонкие',
    description: 'Классические блины, которые не рвутся и легко переворачиваются',
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23daa520' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='20' fill='%23fff'%3EБлины%3C/text%3E%3C/svg%3E",
    cookingTime: 40,
    calories: 165,
    servings: 4,
    author: 'Soroka',
    date: '07.10.2024',
    views: 5234,
    rating: 5.0,
    category: ['Выпечка', 'Завтраки'],
    tags: ['Завтрак', 'Десерт']
  }
];

export const recipeDetails: { [key: number]: RecipeDetail } = {
  1: {
    ...recipes[0],
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
      calories: 130,
      protein: 22,
      fat: 14,
      carbs: 15
    },
    tips: [
      'Чтобы фарш не слёз в комки, важно хорошо его разбить на этапе обжарки',
      'Если у вас тугая капуста, можно сначала её обдать кипятком перед тушением',
      'Если захотите добавить больше овощей — отлично подойдут болгарский перец и помидоры',
      'Блюдо хорошо хранится в холодильнике 3-4 дня'
    ]
  }
};

export const comments: { [key: number]: Comment[] } = {
  1: [
    {
      id: 1,
      author: 'Мария Петрова',
      date: '2 дня назад',
      rating: 5,
      text: 'Потрясающий рецепт! Готовила вчера на ужин, вся семья была в восторге. Капуста получилась нежная, а фарш очень ароматный.'
    },
    {
      id: 2,
      author: 'Александр К.',
      date: '5 дней назад',
      rating: 5,
      text: 'Делал по этому рецепту, добавил немного болгарского перца - получилось еще вкуснее!'
    },
    {
      id: 3,
      author: 'Екатерина',
      date: '1 неделю назад',
      rating: 4,
      text: 'Хороший базовый рецепт. Я добавила немного чеснока и паприки - вышло отлично.'
    }
  ]
};
