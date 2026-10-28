// Firestore falso com o mínimo usado pelos repositórios nos testes
class FakeFirestore {
  constructor() {
    this.dados = {};
    this.contador = 0;
  }

  async recursiveDelete(ref) {
    delete this.dados[ref.colecao][ref.id];
  }

  collection(nome) {
    const armazenamento = (this.dados[nome] ??= {});

    const criarDoc = (id) => ({
      id,
      colecao: nome,
      async set(conteudo) {
        armazenamento[id] = { ...conteudo };
      },
      async update(campos) {
        if (!armazenamento[id]) throw new Error('documento não existe');
        armazenamento[id] = { ...armazenamento[id], ...campos };
      },
      async get() {
        const conteudo = armazenamento[id];
        return {
          id,
          exists: Boolean(conteudo),
          data: () => (conteudo ? { ...conteudo } : undefined),
        };
      },
    });

    return {
      doc: (id) => criarDoc(id || `doc-${++this.contador}`),
      where: (campo, operador, valor) => ({
        async get() {
          const docs = Object.entries(armazenamento)
            .filter(([, conteudo]) => conteudo[campo] === valor)
            .map(([id, conteudo]) => ({ id, data: () => ({ ...conteudo }) }));
          return { docs, empty: docs.length === 0 };
        },
      }),
    };
  }
}

module.exports = { FakeFirestore };
