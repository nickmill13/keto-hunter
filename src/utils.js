export const confidenceLabel = (conf) => {
  if (conf == null) return 'Unknown';
  const n = Number(conf);
  if (n >= 0.75) return 'High';
  if (n >= 0.45) return 'Medium';
  return 'Low';
};

export const getPriceSymbol = (level) => {
  return '$'.repeat(level);
};
