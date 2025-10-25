import { useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recipes } from '../../data/recipes';
import type { Ingredient, InstructionStep } from '../../types';
import './RecipeForm.css';

function RecipeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const existingRecipe = isEdit ? recipes.find(r => r.id === Number(id)) : null;

  const [title, setTitle] = useState(existingRecipe?.title || '');
  const [description, setDescription] = useState(existingRecipe?.description || '');
  const [image, setImage] = useState(existingRecipe?.image || '');
  const [cookingTime, setCookingTime] = useState(existingRecipe?.cookingTime || 30);
  const [servings, setServings] = useState(existingRecipe?.servings || 4);
  const [calories, setCalories] = useState(existingRecipe?.calories || 200);
  const [category, setCategory] = useState<string[]>(existingRecipe?.category || []);
  const [tags, setTags] = useState<string[]>(existingRecipe?.tags || []);

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amount: '' }
  ]);

  const [instructions, setInstructions] = useState<InstructionStep[]>([
    { stepNumber: 1, text: '', images: [] }
  ]);

  const [tips, setTips] = useState<string[]>(['']);

  const [protein, setProtein] = useState(20);
  const [fat, setFat] = useState(10);
  const [carbs, setCarbs] = useState(25);

  const availableCategories = ['Супы', 'Салаты', 'Вторые блюда', 'Выпечка', 'Десерты', 'Заготовки', 'Завтраки'];
  const availableTags = ['Обед', 'Ужин', 'Завтрак', 'Десерт', 'Быстро', 'Бюджетно'];

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: 'name' | 'amount', value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, { stepNumber: instructions.length + 1, text: '', images: [] }]);
  };

  const handleRemoveInstruction = (index: number) => {
    const updated = instructions.filter((_, i) => i !== index);
    setInstructions(updated.map((inst, i) => ({ ...inst, stepNumber: i + 1 })));
  };

  const handleInstructionChange = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index].text = value;
    setInstructions(updated);
  };

  const handleAddImageToStep = (stepIndex: number, imageUrl: string) => {
    const updated = [...instructions];
    if (!updated[stepIndex].images) {
      updated[stepIndex].images = [];
    }
    if (updated[stepIndex].images!.length < 5) {
      updated[stepIndex].images!.push(imageUrl);
      setInstructions(updated);
    }
  };

  const handleRemoveImageFromStep = (stepIndex: number, imageIndex: number) => {
    const updated = [...instructions];
    updated[stepIndex].images = updated[stepIndex].images?.filter((_, i) => i !== imageIndex) || [];
    setInstructions(updated);
  };

  const handleAddTip = () => {
    setTips([...tips, '']);
  };

  const handleRemoveTip = (index: number) => {
    setTips(tips.filter((_, i) => i !== index));
  };

  const handleTipChange = (index: number, value: string) => {
    const updated = [...tips];
    updated[index] = value;
    setTips(updated);
  };

  const handleCategoryToggle = (cat: string) => {
    setCategory(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleTagToggle = (tag: string) => {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: FormEvent, status: 'published' | 'draft' = 'published') => {
    e.preventDefault();

    const recipeData = {
      title,
      description,
      image,
      cookingTime,
      servings,
      calories,
      category,
      tags,
      ingredients: ingredients.filter(ing => ing.name && ing.amount),
      instructions: instructions.filter(inst => inst.text),
      tips: tips.filter(tip => tip),
      nutrition: { calories, protein, fat, carbs },
      status
    };

    console.log(isEdit ? 'Обновление рецепта:' : 'Создание рецепта:', recipeData);
    const message = status === 'draft' ? 'сохранен как черновик' : (isEdit ? 'обновлен' : 'создан');
    alert(`Рецепт ${message} успешно!`);
    navigate('/admin/recipes');
  };

  const handleSaveDraft = (e: FormEvent) => {
    handleSubmit(e, 'draft');
  };

  return (
    <div className="recipe-form">
      <div className="form-header">
        <h2>{isEdit ? 'Редактирование рецепта' : 'Новый рецепт'}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Основная информация</h3>
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Название рецепта *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Введите название рецепта"
              />
            </div>

            <div className="form-field full-width">
              <label>Краткое описание *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                placeholder="Краткое описание рецепта"
              />
            </div>

            <div className="form-field full-width">
              <label>Изображение (URL или base64)</label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="URL изображения"
              />
              {image && (
                <div className="image-preview">
                  <img src={image} alt="Preview" />
                </div>
              )}
            </div>

            <div className="form-field">
              <label>Время приготовления (мин) *</label>
              <input
                type="number"
                value={cookingTime}
                onChange={(e) => setCookingTime(Number(e.target.value))}
                required
                min="1"
              />
            </div>

            <div className="form-field">
              <label>Количество порций *</label>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                required
                min="1"
              />
            </div>

            <div className="form-field">
              <label>Калории (на 100г) *</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                required
                min="1"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Категории</h3>
          <div className="checkbox-group">
            {availableCategories.map(cat => (
              <label key={cat} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={category.includes(cat)}
                  onChange={() => handleCategoryToggle(cat)}
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Теги</h3>
          <div className="checkbox-group">
            {availableTags.map(tag => (
              <label key={tag} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={tags.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                />
                {tag}
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Ингредиенты</h3>
          {ingredients.map((ingredient, index) => (
            <div key={index} className="dynamic-field">
              <input
                type="text"
                placeholder="Название ингредиента"
                value={ingredient.name}
                onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
              />
              <input
                type="text"
                placeholder="Количество"
                value={ingredient.amount}
                onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
              />
              <button type="button" onClick={() => handleRemoveIngredient(index)} className="btn-remove">
                Удалить
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAddIngredient} className="btn-add">
            + Добавить ингредиент
          </button>
        </div>

        <div className="form-section">
          <h3>Пошаговая инструкция</h3>
          {instructions.map((instruction, index) => (
            <div key={index} className="instruction-field">
              <label>Шаг {instruction.stepNumber}</label>
              <textarea
                value={instruction.text}
                onChange={(e) => handleInstructionChange(index, e.target.value)}
                rows={3}
                placeholder="Описание шага"
              />

              <div className="step-images-section">
                <label>Изображения к шагу (до 5 штук)</label>
                <div className="step-images-grid">
                  {instruction.images && instruction.images.map((img, imgIndex) => (
                    <div key={imgIndex} className="step-image-item">
                      <img src={img} alt={`Шаг ${instruction.stepNumber} - ${imgIndex + 1}`} />
                      <button
                        type="button"
                        onClick={() => handleRemoveImageFromStep(index, imgIndex)}
                        className="btn-remove-image"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {(!instruction.images || instruction.images.length < 5) && (
                  <div className="add-image-field">
                    <input
                      type="text"
                      placeholder="URL изображения"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.currentTarget;
                          if (input.value.trim()) {
                            handleAddImageToStep(index, input.value.trim());
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <span className="hint-text">
                      {instruction.images && instruction.images.length > 0
                        ? `Добавлено ${instruction.images.length} из 5 изображений`
                        : 'Введите URL и нажмите Enter'
                      }
                    </span>
                  </div>
                )}
              </div>

              <button type="button" onClick={() => handleRemoveInstruction(index)} className="btn-remove">
                Удалить шаг
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAddInstruction} className="btn-add">
            + Добавить шаг
          </button>
        </div>

        <div className="form-section">
          <h3>Пищевая ценность (на 100г)</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Белки (г)</label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(Number(e.target.value))}
                min="0"
              />
            </div>
            <div className="form-field">
              <label>Жиры (г)</label>
              <input
                type="number"
                value={fat}
                onChange={(e) => setFat(Number(e.target.value))}
                min="0"
              />
            </div>
            <div className="form-field">
              <label>Углеводы (г)</label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(Number(e.target.value))}
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Советы по приготовлению</h3>
          {tips.map((tip, index) => (
            <div key={index} className="dynamic-field">
              <input
                type="text"
                placeholder="Совет"
                value={tip}
                onChange={(e) => handleTipChange(index, e.target.value)}
              />
              <button type="button" onClick={() => handleRemoveTip(index)} className="btn-remove">
                Удалить
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAddTip} className="btn-add">
            + Добавить совет
          </button>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit">
            {isEdit ? 'Сохранить изменения' : 'Опубликовать рецепт'}
          </button>
          {!isEdit && (
            <button type="button" onClick={handleSaveDraft} className="btn-draft">
              💾 Сохранить как черновик
            </button>
          )}
          <button type="button" onClick={() => navigate('/admin/recipes')} className="btn-cancel">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}

export default RecipeForm;
