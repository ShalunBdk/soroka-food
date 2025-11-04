import prisma from '../src/config/database';
import { initializeDefaultTemplates } from '../src/utils/emailTemplates';

async function updateTemplates() {
  try {
    console.log('🗑️  Удаление старых email шаблонов...');
    const deleted = await prisma.emailTemplate.deleteMany({});
    console.log(`✅ Удалено ${deleted.count} старых шаблонов`);

    console.log('\n📧 Создание новых email шаблонов...');
    await initializeDefaultTemplates();
    console.log('✅ Новые шаблоны созданы успешно!');

    console.log('\n🎉 Обновление завершено!');
  } catch (error) {
    console.error('❌ Ошибка при обновлении шаблонов:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateTemplates();
