export const validate = (schema, target = 'body') => (req, res, next) => {
  try {
    req[target] = schema.parse(req[target]);
    next();
  } catch (err) {
    const message = err.errors ? err.errors.map(e => e.message).join(', ') : 'Validation error';
    return res.status(400).json({ message });
  }
};
