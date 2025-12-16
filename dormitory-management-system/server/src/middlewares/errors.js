export function notFound(_req, res) {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || 500;
  const message = err.message || "Internal server error";
  const body = { error: message };
  if (process.env.NODE_ENV !== "production") body.stack = err.stack;
  res.status(status).json(body);
}
