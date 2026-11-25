// Limita as requisições por chave (padrão: IP) em uma janela de tempo (a contagem fica na memória da instância)
function createRateLimit({ max, windowMs, now = Date.now, key = (req) => req.ip }) {
  const acessos = new Map();

  return (req, res, next) => {
    const agora = now();

    // Limpa os IPs vencidos para a memória não crescer
    if (acessos.size > 10000) {
      for (const [chaveAntiga, acesso] of acessos) {
        if (acesso.fim <= agora) acessos.delete(chaveAntiga);
      }
    }

    const chave = key(req);
    let acesso = acessos.get(chave);
    if (!acesso || acesso.fim <= agora) {
      acesso = { total: 0, fim: agora + windowMs };
      acessos.set(chave, acesso);
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
