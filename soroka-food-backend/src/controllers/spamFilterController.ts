import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

// Get spam filter settings
export const getSpamFilterSettings = async (req: Request, res: Response): Promise<void> => {
  let settings = await prisma.spamFilterSettings.findUnique({
    where: { id: 1 }
  });

  // Create default settings if not exist
  if (!settings) {
    settings = await prisma.spamFilterSettings.create({
      data: {
        id: 1,
        customKeywords: [],
        enableKeywordFilter: true,
        enableUrlFilter: true,
        enableCapsFilter: true,
        enableRepetitiveFilter: true,
        enableDuplicateFilter: true,
        maxUrls: 2,
        capsPercentage: 80
      }
    });
  }

  res.json(settings);
};

// Update spam filter settings
export const updateSpamFilterSettings = async (req: Request, res: Response): Promise<void> => {
  const {
    enableKeywordFilter,
    enableUrlFilter,
    enableCapsFilter,
    enableRepetitiveFilter,
    enableDuplicateFilter,
    maxUrls,
    capsPercentage
  } = req.body;

  // Validate thresholds
  if (maxUrls !== undefined && (maxUrls < 0 || maxUrls > 10)) {
    throw new AppError('maxUrls must be between 0 and 10', 400);
  }

  if (capsPercentage !== undefined && (capsPercentage < 0 || capsPercentage > 100)) {
    throw new AppError('capsPercentage must be between 0 and 100', 400);
  }

  const settings = await prisma.spamFilterSettings.upsert({
    where: { id: 1 },
    update: {
      ...(enableKeywordFilter !== undefined && { enableKeywordFilter }),
      ...(enableUrlFilter !== undefined && { enableUrlFilter }),
      ...(enableCapsFilter !== undefined && { enableCapsFilter }),
      ...(enableRepetitiveFilter !== undefined && { enableRepetitiveFilter }),
      ...(enableDuplicateFilter !== undefined && { enableDuplicateFilter }),
      ...(maxUrls !== undefined && { maxUrls }),
      ...(capsPercentage !== undefined && { capsPercentage })
    },
    create: {
      id: 1,
      customKeywords: [],
      enableKeywordFilter: enableKeywordFilter ?? true,
      enableUrlFilter: enableUrlFilter ?? true,
      enableCapsFilter: enableCapsFilter ?? true,
      enableRepetitiveFilter: enableRepetitiveFilter ?? true,
      enableDuplicateFilter: enableDuplicateFilter ?? true,
      maxUrls: maxUrls ?? 2,
      capsPercentage: capsPercentage ?? 80
    }
  });

  res.json({ message: 'Settings updated successfully', settings });
};

// Add custom spam keyword
export const addSpamKeyword = async (req: Request, res: Response): Promise<void> => {
  const { keyword } = req.body;

  if (!keyword || typeof keyword !== 'string') {
    throw new AppError('Keyword is required and must be a string', 400);
  }

  const trimmedKeyword = keyword.trim().toLowerCase();

  if (trimmedKeyword.length < 2) {
    throw new AppError('Keyword must be at least 2 characters', 400);
  }

  const settings = await prisma.spamFilterSettings.findUnique({
    where: { id: 1 }
  });

  const currentKeywords = settings?.customKeywords || [];

  // Check if keyword already exists
  if (currentKeywords.includes(trimmedKeyword)) {
    throw new AppError('Keyword already exists', 400);
  }

  const updatedSettings = await prisma.spamFilterSettings.upsert({
    where: { id: 1 },
    update: {
      customKeywords: [...currentKeywords, trimmedKeyword]
    },
    create: {
      id: 1,
      customKeywords: [trimmedKeyword],
      enableKeywordFilter: true,
      enableUrlFilter: true,
      enableCapsFilter: true,
      enableRepetitiveFilter: true,
      enableDuplicateFilter: true,
      maxUrls: 2,
      capsPercentage: 80
    }
  });

  res.json({ message: 'Keyword added successfully', settings: updatedSettings });
};

// Remove custom spam keyword
export const removeSpamKeyword = async (req: Request, res: Response): Promise<void> => {
  const { keyword } = req.params;

  if (!keyword) {
    throw new AppError('Keyword is required', 400);
  }

  const decodedKeyword = decodeURIComponent(keyword).toLowerCase();

  const settings = await prisma.spamFilterSettings.findUnique({
    where: { id: 1 }
  });

  if (!settings) {
    throw new AppError('Settings not found', 404);
  }

  const currentKeywords = settings.customKeywords;
  const filteredKeywords = currentKeywords.filter(k => k.toLowerCase() !== decodedKeyword);

  if (currentKeywords.length === filteredKeywords.length) {
    throw new AppError('Keyword not found', 404);
  }

  const updatedSettings = await prisma.spamFilterSettings.update({
    where: { id: 1 },
    data: {
      customKeywords: filteredKeywords
    }
  });

  res.json({ message: 'Keyword removed successfully', settings: updatedSettings });
};
