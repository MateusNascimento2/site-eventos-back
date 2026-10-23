const { db, auth } = require('../src/infrastructure/firebase/firebase');

// Teste de fumaça ponta a ponta: organizador -> evento -> convidado.
// Cria dados temporários e remove tudo ao final (inclusive em caso de falha).

async function executar() {
  const sufixo = Date.now();
  const email = `fumaca-${sufixo}@teste.local`;
  let uid = null;
  let eventoRef = null;

  try {
    // 1. Organizador
    const usuario = await auth.createUser({
      email,
      password: `Tmp-${sufixo}-Aa1!`,
      displayName: 'Organizador de Teste',
    });
    uid = usuario.uid;
    console.log('1. Organizador criado:', uid);

    // 2. Evento do organizador
    eventoRef = db.collection('events').doc();
    await eventoRef.set({
      title: 'Evento de fumaça',
      organizerId: uid,
      location: 'Rio de Janeiro',
      date: '2026-12-01',
      createdAt: new Date().toISOString(),
    });
    console.log('2. Evento criado:', eventoRef.id);

    // 3. Convidado na subcoleção do evento
    const convidadoRef = eventoRef.collection('guests').doc();
    await convidadoRef.set({
      name: 'Convidado de Teste',
      confirmed: true,
      plusOne: true,
      createdAt: new Date().toISOString(),
    });
    console.log('3. Convidado criado:', convidadoRef.id);

    // 4. Leitura de volta e verificações
    const evento = (await eventoRef.get()).data();
    const convidado = (await convidadoRef.get()).data();
    const convidados = await eventoRef.collection('guests').get();

    const verificacoes = [
      ['evento pertence ao organizador', evento.organizerId === uid],
      ['convidado gravado na subcoleção do evento', convidados.size === 1],
      ['convidado confirmado', convidado.confirmed === true],
      ['acompanhante (+1) gravado', convidado.plusOne === true],
    ];

    let falhou = false;
    for (const [descricao, ok] of verificacoes) {
      console.log(`4. ${ok ? 'OK ' : 'FALHOU'} - ${descricao}`);
      if (!ok) falhou = true;
    }

    if (falhou) throw new Error('Alguma verificação falhou.');
    console.log('Teste de fumaça concluído com sucesso.');
  } finally {
    // 5. Limpeza dos dados temporários
    if (eventoRef) {
      await db.recursiveDelete(eventoRef);
      console.log('5. Evento temporário removido.');
    }
    if (uid) {
      await auth.deleteUser(uid);
      console.log('5. Organizador temporário removido.');
    }
  }
}

executar().catch((erro) => {
  console.error('Falha no teste de fumaça:', erro.message);
  process.exit(1);
});
