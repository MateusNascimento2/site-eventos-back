// Limita as requisições por IP em uma janela de tempo (a contagem fica na memória da instância)
function createRateLimit({ max, windowMs, now = Date.now }) {
  const acessos = new Map();

  return (req, res, next) => {
    const agora = now();

    // Limpa os IPs vencidos para a memória não crescer
    if (acessos.size > 10000) {
      for (const [ip, acesso] of acessos) {
        if (acesso.fim <= agora) acessos.delete(ip);
      }
    }

    let acesso = acessos.get(req.ip);
    if (!acesso || acesso.fim <= agora) {
      acesso = { total: 0, fim: agora + windowMs };
      acessos.set(req.ip, acesso);
    }
    acesso.total += 1;

    if (acesso.total > max) {
      res.set('Retry-After', String(Math.ceil((acesso.fim - agora) / 1000)));
      return res
        .status(429)
        .json({ error: 'Muitas requisições, tente novamente em alguns minutos' });
    }

    next();
  };
}

module.exports = { createRateLimit };
