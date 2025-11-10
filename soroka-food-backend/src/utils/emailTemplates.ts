import prisma from '../config/database';

// EmailTemplateType enum (matches Prisma schema)
export enum EmailTemplateType {
  VERIFICATION = 'VERIFICATION',
  WELCOME = 'WELCOME',
  NEW_RECIPE = 'NEW_RECIPE',
  UNSUBSCRIBE = 'UNSUBSCRIBE'
}

interface BuiltInTemplate {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  variables: string[];
  type: EmailTemplateType;
  isDefault: boolean;
}

// Built-in email templates
export const builtInTemplates: BuiltInTemplate[] = [
  {
    name: 'verification',
    subject: 'Подтвердите подписку на рассылку Soroka Food',
    bodyHtml: `
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
    .button { display: inline-block; background-color: #8b4513; color: white !important; padding: 14px 32px; text-decoration: none; margin: 25px 0; font-weight: 500; border: 2px solid #8b4513; }
    .button:hover { background: white; color: #8b4513 !important; }
    .info-box { background: #f9f9f9; padding: 15px; border: 1px solid #ddd; margin: 20px 0; font-size: 13px; color: #666; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🦅 Soroka Food</h1>
    </div>
    <div class="content">
      <h2>Подтвердите вашу подписку</h2>
      <p>Спасибо за интерес к нашему кулинарному блогу!</p>
      <p>Чтобы завершить подписку на наши новости и получать уведомления о новых рецептах, пожалуйста, подтвердите ваш email адрес:</p>
      <p style="text-align: center;">
        <a href="{{verificationUrl}}" class="button">Подтвердить подписку</a>
      </p>
      <div class="info-box">
        <p style="margin: 5px 0;">Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:</p>
        <p style="margin: 5px 0; word-break: break-all;">{{verificationUrl}}</p>
        <p style="margin: 5px 0;"><strong>Ссылка действительна 24 часа.</strong></p>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 5px 0;">Если вы не подписывались на рассылку, просто проигнорируйте это письмо.</p>
      <p style="margin: 5px 0;">&copy; 2025 Soroka Food. Все права защищены.</p>
    </div>
  </div>
</body>
</html>
    `,
    bodyText: `
Подтвердите вашу подписку на Soroka Food

Спасибо за интерес к нашему кулинарному блогу!

Чтобы завершить подписку на наши новости и получать уведомления о новых рецептах, пожалуйста, подтвердите ваш email адрес, перейдя по ссылке:

{{verificationUrl}}

Ссылка действительна 24 часа.

Если вы не подписывались на рассылку, просто проигнорируйте это письмо.

© 2025 Soroka Food. Все права защищены.
    `,
    variables: ['verificationUrl'],
    type: EmailTemplateType.VERIFICATION,
    isDefault: true
  },
  {
    name: 'welcome',
    subject: 'Добро пожаловать в Soroka Food!',
    bodyHtml: `
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
    .content ul { color: #555; font-size: 15px; line-height: 2; margin: 20px 0; padding-left: 25px; }
    .button { display: inline-block; background-color: #8b4513; color: white !important; padding: 14px 32px; text-decoration: none; margin: 25px 0; font-weight: 500; border: 2px solid #8b4513; }
    .button:hover { background: white; color: #8b4513 !important; }
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
      <h2>Спасибо за подписку!</h2>
      <p>Ваша подписка успешно подтверждена. Теперь вы будете получать уведомления о новых вкусных рецептах!</p>
      <p>Мы регулярно публикуем:</p>
      <ul>
        <li>🍲 Традиционные блюда разных кухонь мира</li>
        <li>🥗 Здоровые и питательные рецепты</li>
        <li>🍰 Десерты и выпечку</li>
        <li>👨‍🍳 Секреты и советы от профессионалов</li>
      </ul>
      <p style="text-align: center;">
        <a href="{{siteUrl}}" class="button">Посетить сайт</a>
      </p>
    </div>
    <div class="footer">
      <p style="margin: 5px 0;">Чтобы отписаться от рассылки, <a href="{{unsubscribeUrl}}">нажмите здесь</a>.</p>
      <p style="margin: 5px 0;">&copy; 2025 Soroka Food. Все права защищены.</p>
    </div>
  </div>
</body>
</html>
    `,
    bodyText: `
Добро пожаловать в Soroka Food!

Ваша подписка успешно подтверждена. Теперь вы будете получать уведомления о новых вкусных рецептах!

Мы регулярно публикуем:
- Традиционные блюда разных кухонь мира
- Здоровые и питательные рецепты
- Десерты и выпечку
- Секреты и советы от профессионалов

Посетите наш сайт: {{siteUrl}}

Чтобы отписаться от рассылки, перейдите по ссылке: {{unsubscribeUrl}}

© 2025 Soroka Food. Все права защищены.
    `,
    variables: ['siteUrl', 'unsubscribeUrl'],
    type: EmailTemplateType.WELCOME,
    isDefault: true
  },
  {
    name: 'new-recipe',
    subject: 'Новый рецепт: {{recipeName}}',
    bodyHtml: `
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
    `,
    bodyText: `
Новый рецепт: {{recipeName}}

{{recipeDescription}}

⏱️ Время приготовления: {{cookingTime}} мин
🍽️ Порций: {{servings}}
🔥 Калории: {{calories}} ккал

Посмотреть рецепт: {{recipeUrl}}

Чтобы отписаться от рассылки, перейдите по ссылке: {{unsubscribeUrl}}

© 2025 Soroka Food. Все права защищены.
    `,
    variables: ['recipeName', 'recipeDescription', 'recipeImage', 'cookingTime', 'servings', 'calories', 'recipeUrl', 'unsubscribeUrl'],
    type: EmailTemplateType.NEW_RECIPE,
    isDefault: true
  },
  {
    name: 'unsubscribe',
    subject: 'Вы отписались от рассылки Soroka Food',
    bodyHtml: `
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
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🦅 Soroka Food</h1>
    </div>
    <div class="content">
      <h2>Вы отписались от рассылки</h2>
      <p>Нам жаль вас отпускать! Вы больше не будете получать уведомления о новых рецептах.</p>
      <p>Если вы передумаете, вы всегда можете подписаться снова на нашем сайте.</p>
      <p>Спасибо, что были с нами!</p>
    </div>
    <div class="footer">
      <p style="margin: 5px 0;">&copy; 2025 Soroka Food. Все права защищены.</p>
    </div>
  </div>
</body>
</html>
    `,
    bodyText: `
Вы отписались от рассылки Soroka Food

Нам жаль вас отпускать! Вы больше не будете получать уведомления о новых рецептах.

Если вы передумаете, вы всегда можете подписаться снова на нашем сайте.

Спасибо, что были с нами!

© 2025 Soroka Food. Все права защищены.
    `,
    variables: [],
    type: EmailTemplateType.UNSUBSCRIBE,
    isDefault: true
  }
];

// Initialize default email templates in database
export async function initializeDefaultTemplates(): Promise<void> {
  try {
    for (const template of builtInTemplates) {
      // Check if template already exists
      const existing = await prisma.emailTemplate.findUnique({
        where: { name: template.name }
      });

      if (!existing) {
        await prisma.emailTemplate.create({
          data: template
        });
        console.log(`Created default template: ${template.name}`);
      }
    }
  } catch (error) {
    console.error('Failed to initialize default templates:', error);
  }
}

// Get template by type
export async function getTemplateByType(type: EmailTemplateType): Promise<any | null> {
  try {
    // First try to get default template for this type
    const template = await prisma.emailTemplate.findFirst({
      where: {
        type,
        isDefault: true
      }
    });

    // If no default, get any template of this type
    if (!template) {
      return await prisma.emailTemplate.findFirst({
        where: { type }
      });
    }

    return template;
  } catch (error) {
    console.error(`Failed to get template for type ${type}:`, error);
    return null;
  }
}

// Get all available template variables
export function getAllTemplateVariables(): Record<EmailTemplateType, string[]> {
  return {
    VERIFICATION: ['verificationUrl'],
    WELCOME: ['siteUrl', 'unsubscribeUrl'],
    NEW_RECIPE: ['recipeName', 'recipeDescription', 'recipeImage', 'cookingTime', 'servings', 'calories', 'recipeUrl', 'unsubscribeUrl'],
    UNSUBSCRIBE: []
  };
}
