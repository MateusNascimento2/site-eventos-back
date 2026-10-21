const { db } = require('../src/infrastructure/firebase/firebase');

async function testar() {
  const eventos = await db.collection('events').limit(1).get();
  console.log('Eventos encontrados:', eventos.size);

  if (eventos.empty) {
    console.log('Nenhum evento na coleção "events". Verifique o Firestore.');
    return;
  }

  const evento = eventos.docs[0];
  console.log('Evento:', evento.id, evento.data());

  const convidados = await evento.ref.collection('guests').get();
  const presentes = await evento.ref.collection('gifts').get();
  console.log('Convidados no evento:', convidados.size);
  console.log('Presentes no evento:', presentes.size);

  console.log('Conexão com o Firestore OK.');
}

testar().catch((erro) => {
  console.error('Falha na conexão:', erro.message);
  process.exit(1);
});
