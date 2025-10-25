import { Request, Response } from 'express';
import prisma from '../config/database';

// Get public settings (no auth required)
export const getPublicSettings = async (req: Request, res: Response): Promise<void> => {
  let settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });

  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: { id: 1 }
    });
  }

  // Return only public-facing settings
  const publicSettings = {
    siteName: settings.siteName || 'Soroka Food',
    siteDescription: settings.siteDescription || '',
    logo: settings.logo || '',
    socialLinks: {
      youtube: settings.youtube || '',
      instagram: settings.instagram || '',
      telegram: settings.telegram || '',
      tiktok: settings.tiktok || ''
    }
  };

  res.json(publicSettings);
};
