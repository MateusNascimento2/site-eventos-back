// Limita as requisições por chave (padrão: IP) em uma janela de tempo.
// Com store, a contagem fica fora da memória (compartilhada entre as instâncias); sem ele, fica na memória da instância
function createRateLimit({
  name = 'geral',
  max,
  windowMs,
  now = Date.now,
  key = (req) => req.ip,
  store = null,
  onError = console.error,
}) {
  const acessos = new Map();

  function contarNaMemoria(chave, agora) {
    // Limpa as chaves vencidas para a memória não crescer
    if (acessos.size > 10000) {
      for (const [chaveAntiga, acesso] of acessos) {
        if (acesso.fim <= agora) acessos.delete(chaveAntiga);
      }
    }

    let acesso = acessos.get(chave);
    if (!acesso || acesso.fim <= agora) {
      acesso = { total: 0, fim: agora + windowMs };
      acessos.set(chave, acesso);
    }
    acesso.total += 1;
    return acesso;
  }

  function bloquear(res, acesso, agora) {
    res.set('Retry-After', String(Math.ceil((acesso.fim - agora) / 1000)));
    return res.status(429).json({ error: 'Muitas requisições, tente novamente em alguns minutos' });
  }

  if (!store) {
    return (req, res, next) => {
      const agora = now();
      const acesso = contarNaMemoria(key(req), agora);
      if (acesso.total > max) return bloquear(res, acesso, agora);
      next();
    };
  }

  return async (req, res, next) => {
    const agora = now();
    const chave = key(req);

    let acesso;
    try {
      acesso = await store.hit(`${name}:${chave}`, { windowMs, max, agora });
    } catch (erro) {
      onError(`Limite de requisições: falha no store (${name}), usando a memória:`, erro.message);
      acesso = contarNaMemoria(chave, agora);
    }

    if (acesso.total > max) return bloquear(res, acesso, agora);
    next();
  };
}

module.exports = { createRateLimit };
