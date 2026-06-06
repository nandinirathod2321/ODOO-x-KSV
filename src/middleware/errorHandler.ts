export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Conflict: Unique constraint failed', code: err.code });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Not Found: Record not found', code: err.code });
  }

  res.status(500).json({ error: err.message || 'Internal Server Error', code: err.code || null });
};
