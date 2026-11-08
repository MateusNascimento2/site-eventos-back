// Lista as origens permitidas a partir de FRONTEND_URL e CORS_ORIGINS (separadas por vírgula)
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

// Sem origens configuradas libera tudo (desenvolvimento). Sem header Origin (Postman, curl) passa sempre
function createCorsOrigin(getEnv = () => process.env) {
  return (origin, callback) => {
    const origens = allowedOrigins(getEnv());
    callback(null, !origin || origens.length === 0 || origens.includes(origin));
  };
}

module.exports = { allowedOrigins, createCorsOrigin };
