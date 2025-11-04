import React from 'react';
import { Link } from 'react-router-dom';
import type { Recipe } from '../../types/index';
import { getImageUrl } from '../../utils/image';
import './RecipeCard.css';

interface RecipeCardProps {
  recipe: Recipe;
}

// Helper function to strip HTML tags and get plain text
const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  // Strip HTML for card preview
  const plainDescription = stripHtml(recipe.description);

  return (
    <Link to={`/recipe/${recipe.id}`} className="recipe-card">
      <img src={getImageUrl(recipe.image)} alt={recipe.title} className="recipe-image" />
      <div className="recipe-info">
        <h3 className="recipe-title">{recipe.title}</h3>
        <p className="recipe-description">{plainDescription}</p>
        <div className="recipe-meta">
          <span className="meta-item">⏱ {recipe.cookingTime} мин</span>
          <span className="meta-item">👁 {recipe.calories} ккал</span>
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;
