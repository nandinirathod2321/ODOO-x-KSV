export const successResponse = (res: any, data: any, message = 'Success') => {
  return res.json({ data, message });
};

export const paginatedResponse = (res: any, data: any, meta: { total: number; page: number; per_page: number; last_page: number }, message = 'OK') => {
  return res.json({ data, meta, message });
};

export const errorResponse = (res: any, status: number, message: string, errors?: any) => {
  const payload: any = { message };
  if (errors) payload.errors = errors;
  return res.status(status).json(payload);
};
