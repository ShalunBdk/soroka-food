import prisma from '../config/database';

/**
 * Update NEW_RECIPE email template to fix HTML rendering
 * Changes {{recipeDescription}} to {{{recipeDescription}}} to prevent HTML escaping
 */
async function updateNewRecipeTemplate() {
  try {
    console.log('Updating NEW_RECIPE email template...');

    const newBodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.8; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background: white; border: 1px solid #ddd; }
    .header { background-color: #8b4513; color: white; padding: 25px; text-align: center; border-bottom: 2px solid #6d3410; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .content { background-color: #fff; padding: 35px; border-bottom: 1px solid #ddd; }
    .content h2 { color: #333; font-size: 20px; font-weight: 700; border-bottom: 2px solid #8b4513; padding-bottom: 10px; margin-bottom: 20px; }
    .content p { color: #555; font-size: 15px; margin: 15px 0; }
    .recipe-image { width: 100%; max-width: 500px; height: auto; border: 1px solid #ddd; margin: 20px 0; display: block; }
    .button { display: inline-block; background-color: #8b4513; color: white !important; padding: 14px 32px; text-decoration: none; margin: 25px 0; font-weight: 500; border: 2px solid #8b4513; }
    .button:hover { background: white; color: #8b4513 !important; }
    .recipe-info { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; margin: 20px 0; }
    .recipe-info p { margin: 10px 0; font-size: 14px; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .footer a { color: #8b4513; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🦅 Soroka Food</h1>
    </div>
    <div class="content">
      <h2>Новый рецепт: {{recipeName}}</h2>
      {{#if recipeImage}}
      <img src="{{recipeImage}}" alt="{{recipeName}}" class="recipe-image">
      {{/if}}
      <div>{{{recipeDescription}}}</div>
      <div class="recipe-info">
        <p><strong>⏱️ Время приготовления:</strong> {{cookingTime}} мин</p>
        <p><strong>🍽️ Порций:</strong> {{servings}}</p>
        <p><strong>🔥 Калории:</strong> {{calories}} ккал</p>
      </div>
      <p style="text-align: center;">
        <a href="{{recipeUrl}}" class="button">Посмотреть рецепт</a>
      </p>
    </div>
    <div class="footer">
      <p style="margin: 5px 0;">Чтобы отписаться от рассылки, <a href="{{unsubscribeUrl}}">нажмите здесь</a>.</p>
      <p style="margin: 5px 0;">&copy; 2025 Soroka Food. Все права защищены.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Find the new-recipe template
    const template = await prisma.emailTemplate.findFirst({
      where: {
        name: 'new-recipe',
        type: 'NEW_RECIPE'
      }
    });

    if (!template) {
      console.error('❌ NEW_RECIPE template not found in database');
      console.log('Please run: npm run prisma:seed');
      process.exit(1);
    }

    // Update the template
    await prisma.emailTemplate.update({
      where: { id: template.id },
      data: {
        bodyHtml: newBodyHtml.trim()
      }
    });

    console.log('✅ NEW_RECIPE template updated successfully!');
    console.log('The template now uses {{{recipeDescription}}} to render HTML content correctly.');
  } catch (error) {
    console.error('❌ Error updating template:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateNewRecipeTemplate();
