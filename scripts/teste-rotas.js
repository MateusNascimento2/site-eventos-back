require('dotenv').config();

const API_URL = (process.env.API_URL || 'http://localhost:3000').replace(/\/$/, '');

// Testa as rotas da API de verdade (local ou Vercel) e apaga o evento que criou
async function obterToken({ token, email, senha }) {
  if (token) return token;
  if (!email || !senha || !process.env.FIREBASE_API_KEY) return null;

  const resposta = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: senha, returnSecureToken: true }),
    },
  );
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(`Login falhou: ${dados.error?.message}`);
  return dados.idToken;
}

async function chamar(metodo, caminho, { token, corpo } = {}) {
  const resposta = await fetch(API_URL + caminho, {
    method: metodo,
    headers: {
      ...(corpo ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const texto = await resposta.text();
  try {
    return { status: resposta.status, corpo: texto ? JSON.parse(texto) : null };
  } catch {
    return { status: resposta.status, corpo: texto };
  }
}

async function executar() {
  const token = await obterToken({
    token: process.env.TOKEN,
    email: process.env.TESTE_EMAIL,
    senha: process.env.TESTE_SENHA,
  });
  if (!token) {
    throw new Error('Informe TOKEN, ou FIREBASE_API_KEY, TESTE_EMAIL e TESTE_SENHA no .env');
  }
  const token2 = await obterToken({
    token: process.env.TOKEN_2,
    email: process.env.TESTE_EMAIL_2,
    senha: process.env.TESTE_SENHA_2,
  });

  console.log(`Testando ${API_URL}\n`);
  const resultados = [];
  const verificar = (descricao, ok) => {
    resultados.push(ok);
    console.log(`${ok ? 'OK    ' : 'FALHOU'} - ${descricao}`);
  };

  let id = null;
  try {
    const semToken = await chamar('GET', '/events');
    verificar('GET /events sem token devolve 401', semToken.status === 401);

    const perfil = await chamar('POST', '/organizers', { token, corpo: { name: 'Teste Rotas' } });
    verificar(
      'POST /organizers cria o perfil (201) ou já existe (409)',
      [201, 409].includes(perfil.status),
    );

    const eu = await chamar('GET', '/organizers/me', { token });
    verificar(
      'GET /organizers/me devolve o perfil (200)',
      eu.status === 200 && Boolean(eu.corpo?.id),
    );

    const invalido = await chamar('POST', '/events', { token, corpo: { title: '' } });
    verificar('POST /events com dados inválidos devolve 400', invalido.status === 400);

    const criado = await chamar('POST', '/events', {
      token,
      corpo: { title: 'Evento do teste das rotas', date: '2026-12-01', location: 'Rio de Janeiro' },
    });
    id = criado.corpo?.id || null;
    verificar('POST /events cria o evento (201)', criado.status === 201 && Boolean(id));
    verificar('o dono do evento é o usuário do token', criado.corpo?.organizerId === eu.corpo?.id);

    const lista = await chamar('GET', '/events', { token });
    verificar(
      'GET /events lista o evento criado',
      lista.status === 200 && lista.corpo?.some((evento) => evento.id === id),
    );

    const detalhe = await chamar('GET', `/events/${id}`, { token });
    verificar('GET /events/:id devolve o evento (200)', detalhe.status === 200);

    const editado = await chamar('PUT', `/events/${id}`, {
      token,
      corpo: { title: 'Título editado' },
    });
    verificar(
      'PUT /events/:id altera só o título (200)',
      editado.status === 200 &&
        editado.corpo?.title === 'Título editado' &&
        editado.corpo?.location === 'Rio de Janeiro',
    );

    const convite = await chamar('POST', `/events/${id}/invite`, { token });
    verificar(
      'POST /events/:id/invite gera o slug (201)',
      convite.status === 201 && /^[A-Za-z0-9_-]{12}$/.test(convite.corpo?.slug || ''),
    );

    const repetido = await chamar('POST', `/events/${id}/invite`, { token });
    verificar(
      'POST /events/:id/invite de novo devolve o mesmo slug (200)',
      repetido.status === 200 && repetido.corpo?.slug === convite.corpo?.slug,
    );

    const novoConvite = await chamar('POST', `/events/${id}/invite/regenerate`, { token });
    verificar(
      'POST /events/:id/invite/regenerate troca o slug (200)',
      novoConvite.status === 200 && novoConvite.corpo?.slug !== convite.corpo?.slug,
    );

    const publico = await chamar('GET', `/invites/${novoConvite.corpo?.slug}`);
    verificar(
      'GET /invites/:slug abre sem login e não expõe dados internos (200)',
      publico.status === 200 &&
        publico.corpo?.title === 'Título editado' &&
        !('organizerId' in publico.corpo) &&
        !('id' in publico.corpo),
    );

    const antigo = await chamar('GET', `/invites/${convite.corpo?.slug}`);
    verificar('o slug antigo devolve 404 depois de regenerar', antigo.status === 404);

    const inexistente = await chamar('GET', '/events/id-que-nao-existe', { token });
    verificar('GET /events/:id inexistente devolve 404', inexistente.status === 404);

    if (token2) {
      const alheio = await chamar('GET', `/events/${id}`, { token: token2 });
      const alheioPut = await chamar('PUT', `/events/${id}`, {
        token: token2,
        corpo: { title: 'X' },
      });
      const alheioDelete = await chamar('DELETE', `/events/${id}`, { token: token2 });
      const alheioConvite = await chamar('POST', `/events/${id}/invite`, { token: token2 });
      verificar(
        'outro organizador recebe 404 em GET, PUT, DELETE e convite',
        [alheio, alheioPut, alheioDelete, alheioConvite].every((r) => r.status === 404),
      );
    } else {
      console.log('PULADO - teste com outro organizador (defina TOKEN_2 ou TESTE_EMAIL_2/SENHA_2)');
    }

    const desativado = await chamar('DELETE', `/events/${id}/invite`, { token });
    const aposDesativar = await chamar('GET', `/invites/${novoConvite.corpo?.slug}`);
    verificar(
      'DELETE /events/:id/invite desativa o convite (204) e o link devolve 404',
      desativado.status === 204 && aposDesativar.status === 404,
    );

    const removido = await chamar('DELETE', `/events/${id}`, { token });
    verificar('DELETE /events/:id devolve 204', removido.status === 204);
    if (removido.status === 204) id = null;

    const depois = await chamar('GET', `/events/${criado.corpo?.id}`, { token });
    verificar('evento removido devolve 404', depois.status === 404);
  } finally {
    if (id) {
      await chamar('DELETE', `/events/${id}`, { token });
      console.log('\nEvento temporário removido.');
    }
  }

  const falhas = resultados.filter((ok) => !ok).length;
  console.log(`\n${resultados.length - falhas} de ${resultados.length} verificações passaram.`);
  if (falhas > 0) process.exit(1);
}

executar().catch((erro) => {
  console.error('Falha no teste das rotas:', erro.message);
  process.exit(1);
});
