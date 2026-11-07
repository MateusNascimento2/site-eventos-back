// Firestore falso com o mínimo usado pelos repositórios nos testes
class FakeFirestore {
  constructor() {
    this.dados = {};
    this.contador = 0;
  }

  async recursiveDelete(ref) {
    delete this.dados[ref.colecao]?.[ref.id];
    // Apaga também as subcoleções do documento
    for (const caminho of Object.keys(this.dados)) {
      if (caminho.startsWith(`${ref.colecao}/${ref.id}/`)) delete this.dados[caminho];
    }
  }

  // O caminho pode ser uma coleção ("events") ou uma subcoleção ("events/id/guests")
  collection(caminho) {
    const banco = this;
    const armazenamento = (this.dados[caminho] ??= {});

    const criarDoc = (id) => ({
      id,
      colecao: caminho,
      collection: (sub) => banco.collection(`${caminho}/${id}/${sub}`),
      async set(conteudo) {
        armazenamento[id] = { ...conteudo };
      },
      async create(conteudo) {
        if (armazenamento[id]) {
          throw Object.assign(new Error('ALREADY_EXISTS'), { code: 6 });
        }
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

    const todos = () =>
      Object.entries(armazenamento).map(([id, conteudo]) => ({
        id,
        data: () => ({ ...conteudo }),
      }));

    return {
      doc: (id) => criarDoc(id || `doc-${++banco.contador}`),
      async get() {
        const docs = todos();
        return { docs, empty: docs.length === 0 };
      },
      where: (campo, operador, valor) => {
        const consulta = {
          async get() {
            const docs = Object.entries(armazenamento)
              .filter(([, conteudo]) => conteudo[campo] === valor)
              .map(([id, conteudo]) => ({ id, data: () => ({ ...conteudo }) }));
            return { docs, empty: docs.length === 0 };
          },
          limit: () => consulta,
        };
        return consulta;
      },
    };
  }
}

module.exports = { FakeFirestore };
