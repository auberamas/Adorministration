// Error handling

// It returns a 404 status code with a JSON error message
export function notFound(_req, res) {
  res.status(404).json({ error: "Not found" });
}

// Catche errors thrown by routes or other middlewares
export function errorHandler(err, _req, res, _next) {

  // Use the custom status code if provided, otherwise default to 500
  const status = err.statusCode || 500;

  // Use the error message if available, otherwise a generic message
  const message = err.message || "Internal server error";
  const body = { error: message };

  // Include the stack trace when the app is not running for debugging
  if (process.env.NODE_ENV !== "production") body.stack = err.stack;
  
  // Send the error response to the client
  res.status(status).json(body);
}
