// Uso: node scripts/definir-admin.js email@exemplo.com [--remover]
const { auth } = require('../src/infrastructure/firebase/firebase');

async function definirAdmin() {
  const email = process.argv[2];
  const remover = process.argv.includes('--remover');

  if (!email || email.startsWith('--')) {
    console.log('Uso: node scripts/definir-admin.js email@exemplo.com [--remover]');
    process.exit(1);
  }

  const usuario = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(usuario.uid, { ...usuario.customClaims, admin: !remover });

  console.log(`${email} ${remover ? 'deixou de ser' : 'agora é'} administrador.`);
  console.log('A pessoa precisa entrar de novo (ou renovar o token) para valer.');
}

definirAdmin().catch((erro) => {
  console.error('Erro:', erro.message);
  process.exit(1);
});
