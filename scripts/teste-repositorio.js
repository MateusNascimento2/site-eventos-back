const { db } = require('../src/infrastructure/firebase/firebase');
const {
  FirestoreEventRepository,
} = require('../src/infrastructure/repositories/FirestoreEventRepository');
const {
  FirestoreGuestRepository,
} = require('../src/infrastructure/repositories/FirestoreGuestRepository');
const { Event } = require('../src/domain/entities/Event');
const { Guest } = require('../src/domain/entities/Guest');
const { ConflictError } = require('../src/domain/errors');

async function executar() {
  const repositorio = new FirestoreEventRepository(db);
  const convidados = new FirestoreGuestRepository(db);
  const organizerId = `repo-teste-${Date.now()}`;
  let id = null;

  try {
    const criado = await repositorio.create(
      new Event({
        organizerId,
        title: 'Evento do teste do repositório',
        date: '2026-12-01',
        location: 'Rio de Janeiro',
      }),
    );
    id = criado.id;
    console.log('1. Evento criado:', id);

    const encontrado = await repositorio.findById(id);
    const lista = await repositorio.findByOrganizer(organizerId);
    const inexistente = await repositorio.findById('id-que-nao-existe');

    const convidado = new Guest({
      id: 'convidado-teste',
      name: 'Convidado Teste',
      email: 'convidado@teste.com',
      phone: '21987654321',
      confirmed: true,
    });
    await convidados.add(id, convidado);
    let duplicado = false;
    try {
      await convidados.add(id, convidado);
    } catch (erro) {
      duplicado = erro instanceof ConflictError;
    }
    const guardados = await convidados.listByEvent(id);

    const verificacoes = [
      ['create devolve o evento com id', Boolean(id)],
      ['findById encontra o evento criado', encontrado?.title === criado.title],
      ['findByOrganizer lista só o evento do organizador', lista.length === 1],
      ['findById devolve null quando não existe', inexistente === null],
      [
        'add grava o convidado no evento',
        guardados.length === 1 && guardados[0].email === 'convidado@teste.com',
      ],
      ['add com o mesmo id lança ConflictError', duplicado],
    ];

    let falhou = false;
    for (const [descricao, ok] of verificacoes) {
      console.log(`2. ${ok ? 'OK ' : 'FALHOU'} - ${descricao}`);
      if (!ok) falhou = true;
    }

    if (falhou) throw new Error('Alguma verificação falhou.');
    console.log('Teste do repositório concluído com sucesso.');
  } finally {
    if (id) {
      await repositorio.delete(id);
      console.log('3. Evento temporário removido, com os convidados.');
    }
  }
}

executar().catch((erro) => {
  console.error('Falha no teste do repositório:', erro.message);
  process.exit(1);
});
