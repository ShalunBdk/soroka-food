import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getImageUrl } from '../../utils/image';
import type { Ingredient, InstructionStep } from '../../types';
import './RecipeForm.css';

function RecipeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [cookingTime, setCookingTime] = useState(30);
  const [servings, setServings] = useState(4);
  const [calories, setCalories] = useState(200);
  const [tags, setTags] = useState<string[]>([]);

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

  const availableTags = ['Обед', 'Ужин', 'Завтрак', 'Десерт', 'Быстро', 'Бюджетно'];

  // Fetch categories and recipe data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesData = await api.categories.getAll();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);

        // Fetch recipe data if editing
        if (isEdit && id) {
          setLoading(true);
          const recipeData = await api.admin.recipes.getById(Number(id));
          setTitle(recipeData.title || '');
          setDescription(recipeData.description || '');
          setImage(recipeData.image || '');
          setCookingTime(recipeData.cookingTime || 30);
          setServings(recipeData.servings || 4);
          setCalories(recipeData.calories || 200);
          setTags(recipeData.tags || []);
          setIngredients(recipeData.ingredients || [{ name: '', amount: '' }]);
          setInstructions(recipeData.instructions || [{ stepNumber: 1, text: '', images: [] }]);
          setTips(recipeData.tips || ['']);
          setProtein(recipeData.nutrition?.protein || 20);
          setFat(recipeData.nutrition?.fat || 10);
          setCarbs(recipeData.nutrition?.carbs || 25);

          // Set selected category IDs
          if (recipeData.categories && Array.isArray(recipeData.categories)) {
            setSelectedCategoryIds(recipeData.categories.map((c: any) => c.id));
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        alert('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEdit]);

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

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handleTagToggle = (tag: string) => {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Upload main recipe image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    setUploading(true);
    try {
      const result = await api.upload.recipeImage(file);
      setImage(result.url);
      alert('Изображение успешно загружено!');
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Не удалось загрузить изображение');
    } finally {
      setUploading(false);
    }
  };

  // Upload step images
  const handleStepImagesUpload = async (stepIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Check if we would exceed 5 images
    const currentImages = instructions[stepIndex].images || [];
    if (currentImages.length + fileArray.length > 5) {
      alert('Можно загрузить максимум 5 изображений на шаг');
      return;
    }

    setUploading(true);
    try {
      const result = await api.upload.stepImages(fileArray);
      const updated = [...instructions];
      if (!updated[stepIndex].images) {
        updated[stepIndex].images = [];
      }
      updated[stepIndex].images = [...updated[stepIndex].images!, ...result.urls];
      setInstructions(updated);
      alert('Изображения успешно загружены!');
    } catch (err) {
      console.error('Error uploading step images:', err);
      alert('Не удалось загрузить изображения');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent, status: 'PUBLISHED' | 'DRAFT' = 'PUBLISHED') => {
    e.preventDefault();

    if (!title || !description) {
      alert('Пожалуйста, заполните обязательные поля');
      return;
    }

    setLoading(true);
    try {
      const recipeData = {
        title,
        description,
        image,
        cookingTime,
        servings,
        calories,
        author: 'Soroka',
        tags,
        ingredients: ingredients.filter(ing => ing.name && ing.amount),
        instructions: instructions.filter(inst => inst.text).map((inst, i) => ({
          ...inst,
          stepNumber: i + 1
        })),
        tips: tips.filter(tip => tip),
        nutrition: { calories, protein, fat, carbs },
        categories: selectedCategoryIds,
        status
      };

      if (isEdit && id) {
        await api.admin.recipes.update(Number(id), recipeData);
      } else {
        await api.admin.recipes.create(recipeData);
      }

      const message = status === 'DRAFT' ? 'сохранен как черновик' : (isEdit ? 'обновлен' : 'создан');
      alert(`Рецепт ${message} успешно!`);
      navigate('/admin/recipes');
    } catch (err) {
      console.error('Error saving recipe:', err);
      alert('Не удалось сохранить рецепт');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = (e: FormEvent) => {
    handleSubmit(e, 'DRAFT');
  };

  if (loading && isEdit) {
    return <div className="loading-message">Загрузка рецепта...</div>;
  }

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
              <label>Изображение рецепта</label>
              <div className="file-upload-group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="file-input"
                />
                <span className="file-hint">
                  {uploading ? 'Загрузка...' : 'Выберите изображение (JPG, PNG, WebP)'}
                </span>
              </div>
              {image && (
                <div className="image-preview">
                  <img src={getImageUrl(image)} alt="Preview" />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="btn-remove-image"
                  >
                    ✕ Удалить
                  </button>
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
            {Array.isArray(categories) && categories.map(cat => (
              <label key={cat.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.includes(cat.id)}
                  onChange={() => handleCategoryToggle(cat.id)}
                />
                {cat.name}
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
                      <img src={getImageUrl(img)} alt={`Шаг ${instruction.stepNumber} - ${imgIndex + 1}`} />
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
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleStepImagesUpload(index, e)}
                      disabled={uploading}
                      className="file-input"
                    />
                    <span className="hint-text">
                      {uploading
                        ? 'Загрузка...'
                        : instruction.images && instruction.images.length > 0
                        ? `Добавлено ${instruction.images.length} из 5 изображений`
                        : 'Выберите изображения (можно несколько)'
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
          <button type="submit" className="btn-submit" disabled={loading || uploading}>
            {loading ? 'Сохранение...' : (isEdit ? 'Сохранить изменения' : 'Опубликовать рецепт')}
          </button>
          {!isEdit && (
            <button type="button" onClick={handleSaveDraft} className="btn-draft" disabled={loading || uploading}>
              💾 Сохранить как черновик
            </button>
          )}
          <button type="button" onClick={() => navigate('/admin/recipes')} className="btn-cancel" disabled={loading || uploading}>
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}

export default RecipeForm;
