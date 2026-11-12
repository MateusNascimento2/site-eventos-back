function allowedOrigins(env) {
  const valores = [env.FRONTEND_URL, ...(env.CORS_ORIGINS || '').split(',')];
  const origens = [];

  for (const valor of valores) {
    if (!valor || !valor.trim()) continue;
    try {
      origens.push(new URL(valor.trim()).origin);
    } catch {
      // valor que não é URL é ignorado
    }
  }

  return origens;
}

function createCorsOrigin(getEnv = () => process.env) {
  return (origin, callback) => {
    const origens = allowedOrigins(getEnv());
    callback(null, !origin || origens.length === 0 || origens.includes(origin));
  };
}

module.exports = { allowedOrigins, createCorsOrigin };
