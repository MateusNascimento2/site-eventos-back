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

    const nomeConvidado = `Convidado Teste ${Date.now()}`;
    const emailConvidado = `convidado${Date.now()}@teste.com`;
    const rsvp = await chamar('POST', `/invites/${novoConvite.corpo?.slug}/rsvp`, {
      corpo: {
        name: nomeConvidado,
        email: emailConvidado,
        phone: '(21) 98765-4321',
        confirmed: true,
        plusOne: true,
      },
    });
    verificar(
      'POST /invites/:slug/rsvp confirma presença sem login (201)',
      rsvp.status === 201 && rsvp.corpo?.name === nomeConvidado && rsvp.corpo?.plusOne === true,
    );

    const rsvpRepetido = await chamar('POST', `/invites/${novoConvite.corpo?.slug}/rsvp`, {
      corpo: {
        name: 'Outro Nome',
        email: emailConvidado.toUpperCase(),
        phone: '21999998888',
        confirmed: false,
      },
    });
    verificar('o mesmo e-mail confirmando de novo devolve 409', rsvpRepetido.status === 409);

    const convidados = await chamar('GET', `/events/${id}/guests`, { token });
    verificar(
      'GET /events/:id/guests lista o convidado com o e-mail (200)',
      convidados.status === 200 &&
        convidados.corpo?.length === 1 &&
        convidados.corpo[0].email === emailConvidado,
    );

    const soQuemNaoVai = await chamar('GET', `/events/${id}/guests?confirmed=false`, { token });
    verificar(
      'GET /events/:id/guests?confirmed=false não traz quem confirmou',
      soQuemNaoVai.status === 200 && soQuemNaoVai.corpo?.length === 0,
    );

    const resumo = await chamar('GET', `/events/${id}/summary`, { token });
    verificar(
      'GET /events/:id/summary conta 1 confirmado e 1 acompanhante',
      resumo.status === 200 &&
        resumo.corpo?.confirmed === 1 &&
        resumo.corpo?.plusOnes === 1 &&
        resumo.corpo?.attending === 2,
    );

    const rsvpInvalido = await chamar('POST', `/invites/${novoConvite.corpo?.slug}/rsvp`, {
      corpo: { name: 'Sem confirmação', email: emailConvidado, phone: '21999998888' },
    });
    verificar('POST /invites/:slug/rsvp sem confirmed devolve 400', rsvpInvalido.status === 400);

    const jsonQuebrado = await fetch(`${API_URL}/invites/${novoConvite.corpo?.slug}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ "name": ',
    });
    verificar('JSON inválido devolve 400', jsonQuebrado.status === 400);

    const corpoGrande = await chamar('POST', `/invites/${novoConvite.corpo?.slug}/rsvp`, {
      corpo: { name: 'a'.repeat(20000) },
    });
    verificar('corpo grande demais devolve 413', corpoGrande.status === 413);

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
      const alheioGuests = await chamar('GET', `/events/${id}/guests`, { token: token2 });
      const alheioResumo = await chamar('GET', `/events/${id}/summary`, { token: token2 });
      const alheioPresentes = await chamar('GET', `/events/${id}/gifts`, { token: token2 });
      const alheioPix = await chamar('PUT', `/events/${id}/pix`, {
        token: token2,
        corpo: { pixEnabled: false },
      });
      verificar(
        'outro organizador recebe 404 em GET, PUT, DELETE, convite, lista, resumo, presentes e Pix',
        [
          alheio,
          alheioPut,
          alheioDelete,
          alheioConvite,
          alheioGuests,
          alheioResumo,
          alheioPresentes,
          alheioPix,
        ].every((r) => r.status === 404),
      );
    } else {
      console.log('PULADO - teste com outro organizador (defina TOKEN_2 ou TESTE_EMAIL_2/SENHA_2)');
    }

    const presente = await chamar('POST', `/events/${id}/gifts`, {
      token,
      corpo: { name: 'Jogo de panelas', description: 'Inox' },
    });
    verificar(
      'POST /events/:id/gifts cria o presente (201)',
      presente.status === 201 && presente.corpo?.name === 'Jogo de panelas',
    );

    const presenteInvalido = await chamar('POST', `/events/${id}/gifts`, {
      token,
      corpo: { description: 'sem nome' },
    });
    verificar('POST /events/:id/gifts sem name devolve 400', presenteInvalido.status === 400);

    const presenteEditado = await chamar('PUT', `/events/${id}/gifts/${presente.corpo?.id}`, {
      token,
      corpo: { name: 'Jogo de panelas inox' },
    });
    verificar(
      'PUT /events/:id/gifts/:giftId edita o nome e mantém a descrição (200)',
      presenteEditado.status === 200 &&
        presenteEditado.corpo?.name === 'Jogo de panelas inox' &&
        presenteEditado.corpo?.description === 'Inox',
    );

    const presentes = await chamar('GET', `/events/${id}/gifts`, { token });
    verificar(
      'GET /events/:id/gifts lista o presente (200)',
      presentes.status === 200 && presentes.corpo?.length === 1,
    );

    const presenteRemovido = await chamar('DELETE', `/events/${id}/gifts/${presente.corpo?.id}`, {
      token,
    });
    const presenteDeNovo = await chamar('DELETE', `/events/${id}/gifts/${presente.corpo?.id}`, {
      token,
    });
    verificar(
      'DELETE /events/:id/gifts/:giftId remove (204) e repetir devolve 404',
      presenteRemovido.status === 204 && presenteDeNovo.status === 404,
    );

    const pixInvalido = await chamar('PUT', `/events/${id}/pix`, {
      token,
      corpo: { pixEnabled: true },
    });
    verificar('PUT /events/:id/pix habilitando sem chave devolve 400', pixInvalido.status === 400);

    const pixSalvo = await chamar('PUT', `/events/${id}/pix`, {
      token,
      corpo: { pixKey: 'casal@teste.com', whatsapp: '(21) 98765-4321', pixEnabled: true },
    });
    verificar(
      'PUT /events/:id/pix salva a chave, o WhatsApp e habilita o Pix (200)',
      pixSalvo.status === 200 &&
        pixSalvo.corpo?.whatsapp === '21987654321' &&
        pixSalvo.corpo?.pixEnabled === true,
    );

    const presentesPublicos = await chamar('GET', `/invites/${novoConvite.corpo?.slug}/gifts`);
    verificar(
      'GET /invites/:slug/gifts mostra o Pix habilitado, sem login (200)',
      presentesPublicos.status === 200 && presentesPublicos.corpo?.pix?.key === 'casal@teste.com',
    );

    await chamar('PUT', `/events/${id}/pix`, { token, corpo: { pixEnabled: false } });
    const semPix = await chamar('GET', `/invites/${novoConvite.corpo?.slug}/gifts`);
    verificar(
      'Pix desabilitado some do GET público',
      semPix.status === 200 && semPix.corpo?.pix === null,
    );

    const desativado = await chamar('DELETE', `/events/${id}/invite`, { token });
    const aposDesativar = await chamar('GET', `/invites/${novoConvite.corpo?.slug}`);
    verificar(
      'DELETE /events/:id/invite desativa o convite (204) e o link devolve 404',
      desativado.status === 204 && aposDesativar.status === 404,
    );

    const rsvpAposDesativar = await chamar('POST', `/invites/${novoConvite.corpo?.slug}/rsvp`, {
      corpo: {
        name: 'Depois de desativar',
        email: 'depois@teste.com',
        phone: '21999998888',
        confirmed: true,
      },
    });
    verificar('RSVP com o convite desativado devolve 404', rsvpAposDesativar.status === 404);

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
