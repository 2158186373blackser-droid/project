const { SensitiveWord } = require('../models');
const logger = require('../utils/logger');

// 内存缓存敏感词
let sensitiveWordsCache = [];
let cacheExpireTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

const loadSensitiveWords = async () => {
  const now = Date.now();
  if (sensitiveWordsCache.length > 0 && now < cacheExpireTime) {
    return sensitiveWordsCache;
  }
  
  try {
    const words = await SensitiveWord.findAll({
      attributes: ['word', 'level']
    });
    sensitiveWordsCache = words;
    cacheExpireTime = now + CACHE_TTL;
    return words;
  } catch (error) {
    logger.error('加载敏感词失败:', error);
    return [];
  }
};

const filter = async (text) => {
  const words = await loadSensitiveWords();
  let hasBlockWord = false;
  let hasReviewWord = false;
  
  const lowerText = text.toLowerCase();
  
  for (const item of words) {
    if (lowerText.includes(item.word.toLowerCase())) {
      if (item.level === 'block') {
        hasBlockWord = true;
      } else {
        hasReviewWord = true;
      }
    }
  }
  
  return {
    safe: !hasBlockWord && !hasReviewWord,
    hasBlockWord,
    hasReviewWord,
    needReview: hasReviewWord,
    canPublish: !hasBlockWord
  };
};

const reloadCache = async () => {
  cacheExpireTime = 0;
  await loadSensitiveWords();
};

module.exports = {
  filter,
  reloadCache
};