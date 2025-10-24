import React from 'react';
import { Link } from 'react-router-dom';
import type { Recipe } from '../../types/index';
import './RecipeCard.css';

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  return (
    <Link to={`/recipe/${recipe.id}`} className="recipe-card">
      <img src={recipe.image} alt={recipe.title} className="recipe-image" />
      <div className="recipe-info">
        <h3 className="recipe-title">{recipe.title}</h3>
        <p className="recipe-description">{recipe.description}</p>
        <div className="recipe-meta">
          <span className="meta-item">⏱ {recipe.cookingTime} мин</span>
          <span className="meta-item">👁 {recipe.calories} ккал</span>
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;
