import React from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'react-qr-code';
import type { RecipeDetail, Ingredient } from '../../types';
import { formatTime } from '../../utils/time';
import { getImageUrl } from '../../utils/image';
import './RecipePrintView.css';

interface RecipePrintViewProps {
  recipe: RecipeDetail;
  currentServings: number;
}

const RecipePrintView: React.FC<RecipePrintViewProps> = ({ recipe, currentServings }) => {
  // Calculate the scaling factor for ingredients
  const scaleFactor = recipe.servings > 0 ? currentServings / recipe.servings : 1;

  // Scale ingredient quantities
  const scaleIngredient = (ingredient: Ingredient): string => {
    if (ingredient.quantity && ingredient.unit) {
      const scaledQuantity = ingredient.quantity * scaleFactor;
      const formattedQuantity = Number.isInteger(scaledQuantity)
        ? scaledQuantity.toString()
        : scaledQuantity.toFixed(1).replace(/\.0$/, '');
      return `${ingredient.name} - ${formattedQuantity} ${ingredient.unit}`;
    }
    return `${ingredient.name} - ${ingredient.amount}`;
  };

  // Group ingredients by category
  const groupedIngredients = recipe.ingredients.reduce((acc, ingredient) => {
    const category = ingredient.category || 'Основные ингредиенты';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(ingredient);
    return acc;
  }, {} as Record<string, Ingredient[]>);

  // Get current URL for QR code
  const recipeUrl = `${window.location.origin}/recipe/${recipe.id}`;

  // Format total time
  const totalTime = (recipe.prepTime || 0) + recipe.cookingTime;

  const printContent = (
    <div className="recipe-print-view">
      {/* Header */}
      <div className="print-header">
        <h1 className="print-title">{recipe.title}</h1>
        {recipe.description && (
          <div
            className="print-description"
            dangerouslySetInnerHTML={{ __html: recipe.description }}
          />
        )}
      </div>

      {/* Recipe Info */}
      <div className="print-info">
        <div className="print-info-row">
          <div className="print-info-item">
            <strong>Порций:</strong> {currentServings}
          </div>
          {recipe.prepTime && recipe.prepTime > 0 && (
            <div className="print-info-item">
              <strong>Подготовка:</strong> {formatTime(recipe.prepTime)}
            </div>
          )}
          <div className="print-info-item">
            <strong>Приготовление:</strong> {formatTime(recipe.cookingTime)}
          </div>
          <div className="print-info-item">
            <strong>Всего времени:</strong> {formatTime(totalTime)}
          </div>
        </div>
      </div>

      {/* Main Image */}
      {recipe.image && (
        <div className="print-image-container">
          <img
            src={getImageUrl(recipe.image)}
            alt={recipe.title}
            className="print-image"
          />
        </div>
      )}

      {/* Ingredients */}
      <div className="print-section">
        <h2 className="print-section-title">Ингредиенты</h2>
        {Object.entries(groupedIngredients).map(([category, ingredients]) => (
          <div key={category} className="print-ingredient-category">
            {Object.keys(groupedIngredients).length > 1 && (
              <h3 className="print-ingredient-category-title">{category}</h3>
            )}
            <ul className="print-ingredient-list">
              {ingredients.map((ingredient, index) => (
                <li key={index} className="print-ingredient-item">
                  {scaleIngredient(ingredient)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="print-section">
        <h2 className="print-section-title">Инструкция по приготовлению</h2>
        <ol className="print-instruction-list">
          {recipe.instructions.map((step) => (
            <li key={step.stepNumber} className="print-instruction-step">
              <div dangerouslySetInnerHTML={{ __html: step.text }} />
              {step.images && step.images.length > 0 && (
                <div className="print-step-images">
                  {step.images.map((image, idx) => (
                    <img
                      key={idx}
                      src={getImageUrl(image)}
                      alt={`Шаг ${step.stepNumber} - изображение ${idx + 1}`}
                      className="print-step-image"
                    />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Nutrition */}
      {recipe.nutrition && (recipe.nutrition.calories > 0 || recipe.nutrition.protein > 0) && (
        <div className="print-section">
          <h2 className="print-section-title">Пищевая ценность (на порцию)</h2>
          <div className="print-nutrition">
            <div className="print-nutrition-item">
              <strong>Калории:</strong> {recipe.nutrition.calories} ккал
            </div>
            <div className="print-nutrition-item">
              <strong>Белки:</strong> {recipe.nutrition.protein} г
            </div>
            <div className="print-nutrition-item">
              <strong>Жиры:</strong> {recipe.nutrition.fat} г
            </div>
            <div className="print-nutrition-item">
              <strong>Углеводы:</strong> {recipe.nutrition.carbs} г
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      {recipe.tips && recipe.tips.length > 0 && (
        <div className="print-section">
          <h2 className="print-section-title">Советы</h2>
          <ul className="print-tips-list">
            {recipe.tips.map((tip, index) => (
              <li key={index} className="print-tip-item">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* QR Code Section */}
      <div className="print-qr-section">
        <div className="print-qr-container">
          <QRCode
            value={recipeUrl}
            size={100}
            level="M"
          />
          <p className="print-qr-text">Отсканируйте для открытия на телефоне</p>
        </div>
      </div>

      {/* Footer */}
      <div className="print-footer">
        <p>Рецепт с сайта {window.location.hostname}</p>
      </div>
    </div>
  );

  return createPortal(printContent, document.body);
};

export default RecipePrintView;
