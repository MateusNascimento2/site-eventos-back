# site-eventos-back

Backend (API Node.js + Firebase) do Sistema SaaS de Landing Pages para Eventos e Aniversários.

## Requisitos

- Node.js 22 ou superior
- Projeto no Firebase com Authentication e Firestore ativos
- Credenciais do Admin SDK (conta de serviço)

## Como rodar

1. `npm install`
2. Copie `.env.example` para `.env` e preencha as variáveis (veja abaixo).
3. `npm run dev`

A API sobe em `http://localhost:3000`.

## Variáveis de ambiente

| Variável                | Descrição                                            |
| ----------------------- | ---------------------------------------------------- |
| `PORT`                  | Porta do servidor (padrão 3000)                      |
| `FIREBASE_PROJECT_ID`   | ID do projeto no Firebase                            |
| `FIREBASE_CLIENT_EMAIL` | E-mail da conta de serviço                           |
| `FIREBASE_PRIVATE_KEY`  | Chave privada, entre aspas duplas, com `\n` literais |

O servidor não inicia se alguma variável do Firebase estiver ausente. **Nunca** commite o `.env` nem o JSON da chave.

## Scripts

| Comando                | O que faz                                  |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Servidor com reinício automático (nodemon) |
| `npm start`            | Servidor em modo produção                  |
| `npm test`             | Testes (Jest + Supertest)                  |
| `npm run lint`         | Análise estática (ESLint)                  |
| `npm run format`       | Formatação (Prettier)                      |
| `npm run test:conexao` | Verifica a conexão com o Firestore         |

## Arquitetura (Clean Architecture)

```
src/
├── domain/            # entidades e contratos de repositório (sem dependências externas)
├── application/       # casos de uso
├── infrastructure/    # configuração, Firebase e implementações dos repositórios
├── presentation/http/ # rotas, controllers e middlewares (Express)
└── main/              # composição (container) e inicialização do servidor
```

Regra de dependência: `presentation` e `infrastructure` dependem de `application`, que depende de `domain`. O `domain` não importa nada de fora.

## Convenções

- Todo caso de uso novo recebe seus repositórios pelo construtor e é ligado em `src/main/container.js`.
- Antes do commit: `npm run lint` e `npm test`.
