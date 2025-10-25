import { useMemo } from 'react';
import { useCategories } from './useCategories';
import type { SidebarSection } from '../types/index';

export const useSidebarData = () => {
  const { categories, loading } = useCategories();

  const sidebarSections: SidebarSection[] = useMemo(() => {
    // Popular categories - top 5 by recipe count
    const popularCategories = [...categories]
      .sort((a, b) => (b.recipeCount || 0) - (a.recipeCount || 0))
      .slice(0, 5)
      .map(cat => ({
        title: cat.name,
        url: `/category/${cat.slug}`
      }));

    // All categories
    const allCategoriesLinks = categories.map(cat => ({
      title: cat.name,
      url: `/category/${cat.slug}`
    }));

    return [
      {
        title: 'Популярно сейчас',
        links: popularCategories.length > 0 ? popularCategories : [
          { title: 'Загрузка...', url: '#' }
        ]
      },
      {
        title: 'Категории блюд',
        links: allCategoriesLinks.length > 0 ? allCategoriesLinks : [
          { title: 'Загрузка...', url: '#' }
        ]
      },
      {
        title: 'По типу кухни',
        links: [
          { title: 'Русская кухня', url: '/cuisine/russian' },
          { title: 'Европейская', url: '/cuisine/european' },
          { title: 'Азиатская', url: '/cuisine/asian' },
          { title: 'Восточная', url: '/cuisine/eastern' }
        ]
      }
    ];
  }, [categories]);

  return { sidebarSections, loading };
};
