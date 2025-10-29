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
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

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

  // Fetch categories, tags, and recipe data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesData = await api.categories.getAll();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);

        // Fetch existing tags
        try {
          const tagsData = await api.admin.tags.getAll();
          const tagNames = tagsData.map((t: any) => t.name);
          setAvailableTags(tagNames);
        } catch (err) {
          console.error('Error fetching tags:', err);
          // Set default tags if API fails
          setAvailableTags(['Обед', 'Ужин', 'Завтрак', 'Десерт', 'Быстро', 'Бюджетно']);
        }

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

  const handleRemoveCategory = (categoryId: number) => {
    setSelectedCategoryIds(prev => prev.filter(id => id !== categoryId));
  };

  const handleAddNewCategory = async () => {
    const trimmedName = newCategoryName.trim();
    const trimmedSlug = newCategorySlug.trim();

    if (!trimmedName || !trimmedSlug) {
      alert('Пожалуйста, заполните название и slug категории');
      return;
    }

    try {
      const newCategory = await api.admin.categories.create({
        name: trimmedName,
        slug: trimmedSlug,
        description: ''
      });

      // Refresh categories list
      const categoriesData = await api.categories.getAll();
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);

      // Select the newly created category
      setSelectedCategoryIds(prev => [...prev, newCategory.id]);

      // Reset form
      setNewCategoryName('');
      setNewCategorySlug('');
      setShowAddCategory(false);
    } catch (err) {
      alert('Не удалось создать категорию. Возможно, такой slug уже существует.');
      console.error('Error creating category:', err);
    }
  };

  const generateSlug = (name: string) => {
    const translit: { [key: string]: string } = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
      'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
      'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
      'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };

    return name.toLowerCase()
      .split('')
      .map(char => translit[char] || char)
      .join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTagToggle = (tag: string) => {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddNewTag = () => {
    const trimmedTag = newTagInput.trim();
    if (trimmedTag && !availableTags.includes(trimmedTag)) {
      setAvailableTags(prev => [...prev, trimmedTag]);
      setTags(prev => [...prev, trimmedTag]);
      setNewTagInput('');
    } else if (trimmedTag && availableTags.includes(trimmedTag)) {
      // If tag already exists, just select it
      if (!tags.includes(trimmedTag)) {
        setTags(prev => [...prev, trimmedTag]);
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
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

          {/* Add new category button/form */}
          <div style={{ marginBottom: '1rem' }}>
            {!showAddCategory ? (
              <button
                type="button"
                onClick={() => setShowAddCategory(true)}
                className="btn-add"
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                + Создать новую категорию
              </button>
            ) : (
              <div style={{
                padding: '1rem',
                background: '#f9f9f9',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '1rem'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                  Новая категория
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Название категории (например, Салаты)"
                    value={newCategoryName}
                    onChange={(e) => {
                      setNewCategoryName(e.target.value);
                      // Auto-generate slug
                      setNewCategorySlug(generateSlug(e.target.value));
                    }}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Slug (например, salads)"
                    value={newCategorySlug}
                    onChange={(e) => setNewCategorySlug(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      className="btn-submit"
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      Создать
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategoryName('');
                        setNewCategorySlug('');
                      }}
                      className="btn-secondary"
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selected categories */}
          {selectedCategoryIds.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Выбранные категории:
              </strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedCategoryIds.map(catId => {
                  const cat = categories.find(c => c.id === catId);
                  return cat ? (
                    <span
                      key={catId}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.4rem 0.8rem',
                        background: '#2196F3',
                        color: 'white',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        gap: '0.5rem'
                      }}
                    >
                      {cat.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(catId)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          padding: 0,
                          lineHeight: 1
                        }}
                        title="Удалить"
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Available categories */}
          <div>
            <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Доступные категории (клик для добавления):
            </strong>
            <div className="checkbox-group">
              {Array.isArray(categories) && categories
                .filter(cat => !selectedCategoryIds.includes(cat.id))
                .map(cat => (
                  <label key={cat.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => handleCategoryToggle(cat.id)}
                    />
                    {cat.name}
                  </label>
                ))}
              {categories.filter(cat => !selectedCategoryIds.includes(cat.id)).length === 0 && (
                <p style={{ color: '#999', fontSize: '0.9rem' }}>
                  Все категории уже выбраны
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Теги</h3>

          {/* Add new tag input */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                placeholder="Добавить новый тег..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewTag();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <button
                type="button"
                onClick={handleAddNewTag}
                className="btn-add"
                style={{ padding: '0.5rem 1rem' }}
              >
                + Добавить
              </button>
            </div>
          </div>

          {/* Selected tags */}
          {tags.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Выбранные теги:
              </strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.4rem 0.8rem',
                      background: '#4CAF50',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '0.9rem',
                      gap: '0.5rem'
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        padding: 0,
                        lineHeight: 1
                      }}
                      title="Удалить"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Available tags */}
          <div>
            <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Доступные теги (клик для добавления):
            </strong>
            <div className="checkbox-group">
              {availableTags.filter(tag => !tags.includes(tag)).map(tag => (
                <label key={tag} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => handleTagToggle(tag)}
                  />
                  {tag}
                </label>
              ))}
              {availableTags.filter(tag => !tags.includes(tag)).length === 0 && (
                <p style={{ color: '#999', fontSize: '0.9rem' }}>
                  Все доступные теги уже выбраны
                </p>
              )}
            </div>
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
