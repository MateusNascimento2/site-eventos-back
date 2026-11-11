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

| Variável                | Descrição                                                     |
| ----------------------- | ------------------------------------------------------------- |
| `PORT`                  | Porta do servidor (padrão 3000)                               |
| `FIREBASE_PROJECT_ID`   | ID do projeto no Firebase                                     |
| `FIREBASE_CLIENT_EMAIL` | E-mail da conta de serviço                                    |
| `FIREBASE_PRIVATE_KEY`  | Chave privada, entre aspas duplas, com `\n` literais          |
| `FRONTEND_URL`          | URL do front (opcional), usada para montar o link do convite  |
| `CORS_ORIGINS`          | Outras origens do navegador, separadas por vírgula (opcional) |

Com `FRONTEND_URL` ou `CORS_ORIGINS` preenchidos, só essas origens podem chamar a API pelo navegador (exemplo de `CORS_ORIGINS`: `http://localhost:5173`). Sem nenhuma das duas, qualquer origem é aceita, o que serve só para desenvolvimento. Postman e curl não são afetados.

O servidor não inicia se alguma variável do Firebase estiver ausente. **Nunca** commite o `.env` nem o JSON da chave.

## Scripts

| Comando                    | O que faz                                  |
| -------------------------- | ------------------------------------------ |
| `npm run dev`              | Servidor com reinício automático (nodemon) |
| `npm start`                | Servidor em modo produção                  |
| `npm test`                 | Testes (Jest + Supertest)                  |
| `npm run lint`             | Análise estática (ESLint)                  |
| `npm run format`           | Formatação (Prettier)                      |
| `npm run test:conexao`     | Verifica a conexão com o Firestore         |
| `npm run test:fumaca`      | Teste de fumaça da API                     |
| `npm run test:repositorio` | Testa o repositório no Firestore real      |

## Rotas

Todas respondem JSON. Erros vêm no formato `{ "error": "mensagem" }`.

### Autenticação

O login e o cadastro são feitos pelo front com o Firebase Authentication. As rotas protegidas exigem o cabeçalho:

```
Authorization: Bearer <idToken do Firebase>
```

Sem o cabeçalho a resposta é `401 Token não informado`, e com token inválido ou expirado é `401 Token inválido`. O dono do evento é sempre o usuário do token: `organizerId` enviado no corpo é ignorado.

### Públicas

| Método | Rota                  | Resposta                                                                                         |
| ------ | --------------------- | ------------------------------------------------------------------------------------------------ |
| GET    | `/`                   | `200 { "status": "API no ar" }`                                                                  |
| GET    | `/health/firebase`    | `200` se o Firestore responde, `503` se não                                                      |
| GET    | `/invites/:slug`      | Dados públicos do evento para a página do convite (`404` se o link não existe ou foi desativado) |
| POST   | `/invites/:slug/rsvp` | O convidado confirma ou recusa presença (`201`)                                                  |

### Organizador (protegidas)

| Método | Rota             | O que faz                         | Sucesso |
| ------ | ---------------- | --------------------------------- | ------- |
| POST   | `/organizers`    | Cria o perfil de quem está logado | 201     |
| GET    | `/organizers/me` | Devolve o perfil de quem logou    | 200     |

`POST /organizers` recebe `{ "name": "Ana Souza" }` (obrigatório, até 120 caracteres). O `id` e o `email` vêm do token. Devolve:

```json
{
  "id": "uid-do-firebase",
  "name": "Ana Souza",
  "email": "ana@email.com",
  "createdAt": "2026-10-28T22:00:00.000Z"
}
```

Erros: `400` sem nome, `409 Organizador já cadastrado`, e `404 Organizador não encontrado` no `GET /organizers/me` se o perfil ainda não foi criado.

### Eventos (protegidas)

| Método | Rota                            | O que faz                                           | Sucesso                        |
| ------ | ------------------------------- | --------------------------------------------------- | ------------------------------ |
| POST   | `/events`                       | Cria um evento                                      | 201                            |
| GET    | `/events`                       | Lista os eventos do organizador, ordenados por data | 200                            |
| GET    | `/events/:id`                   | Detalhes de um evento                               | 200                            |
| PUT    | `/events/:id`                   | Edita o evento (só os campos enviados)              | 200                            |
| DELETE | `/events/:id`                   | Remove o evento, com convidados e presentes         | 204                            |
| POST   | `/events/:id/invite`            | Gera o link do convite, ou devolve o atual          | 201 (novo) ou 200 (já existia) |
| POST   | `/events/:id/invite/regenerate` | Gera um novo link; o antigo deixa de funcionar      | 200                            |
| DELETE | `/events/:id/invite`            | Desativa o convite: o link deixa de funcionar       | 204                            |

Campos do corpo em `POST` e `PUT`:

| Campo         | Regra                                                   |
| ------------- | ------------------------------------------------------- |
| `title`       | Obrigatório no `POST`, até 120 caracteres               |
| `date`        | Obrigatório no `POST`, formato `AAAA-MM-DD` e data real |
| `location`    | Obrigatório no `POST`                                   |
| `description` | Opcional, texto de até 1000 caracteres                  |
| `layout`      | Opcional, texto (padrão `basico`)                       |

Resposta de um evento:

```json
{
  "id": "abc123",
  "organizerId": "uid-do-firebase",
  "title": "Casamento",
  "date": "2026-12-01",
  "location": "Rio de Janeiro",
  "description": "",
  "layout": "basico",
  "slug": null,
  "whatsapp": null,
  "pixKey": null,
  "pixEnabled": false,
  "createdAt": "2026-10-28T22:00:00.000Z"
}
```

`slug` só muda pelas rotas de convite, e `whatsapp`, `pixKey` e `pixEnabled` não são alterados por estas rotas (entram na fase de presentes).

Erros comuns:

| Código | Quando                                                                                                     |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| 400    | Dado inválido, ou `PUT` sem nenhum campo editável                                                          |
| 401    | Token ausente ou inválido                                                                                  |
| 404    | Evento inexistente, de outro organizador ou com `id` de formato inválido (a API não revela que ele existe) |

### Convite (protegidas)

`POST /events/:id/invite` gera o `slug` do convite: 12 caracteres aleatórios e seguros para URL. Se o evento já tem convite, devolve o mesmo link (200). `POST /events/:id/invite/regenerate` troca o `slug`, e o link antigo deixa de funcionar. Nas duas, não há corpo. `DELETE /events/:id/invite` desativa o convite (o `slug` é apagado) e devolve `204`, mesmo que o convite já estivesse desativado. Depois disso, `POST /events/:id/invite` gera um link novo.

```json
{
  "eventId": "abc123",
  "slug": "k3Jd9xQ_a1Zb",
  "url": "https://seu-front.vercel.app/convite/k3Jd9xQ_a1Zb"
}
```

A `url` é montada com a variável `FRONTEND_URL` e o caminho `/convite/<slug>`. Sem `FRONTEND_URL`, a `url` vem `null` e o front monta o link com o `slug`. Evento inexistente ou de outro organizador devolve `404`.

### Convidados do evento (protegidas)

| Método | Rota                  | O que faz                                                   | Resposta |
| ------ | --------------------- | ----------------------------------------------------------- | -------- |
| GET    | `/events/:id/guests`  | Lista quem respondeu o convite, do mais antigo ao mais novo | 200      |
| GET    | `/events/:id/summary` | Totais do evento para o painel                              | 200      |

`GET /events/:id/guests` aceita o filtro `?confirmed=true` (quem vai) ou `?confirmed=false` (quem recusou). Qualquer outro valor devolve `400 confirmed deve ser true ou false`. Cada item da lista:

```json
{
  "id": "9f2c...",
  "name": "Ana Souza",
  "email": "ana@email.com",
  "phone": "21987654321",
  "confirmed": true,
  "plusOne": true,
  "createdAt": "2026-11-06T22:00:00.000Z"
}
```

`GET /events/:id/summary`:

```json
{ "total": 4, "confirmed": 3, "declined": 1, "plusOnes": 2, "attending": 5 }
```

`total` é quem respondeu, `declined` é quem disse que não vai, `plusOnes` conta os acompanhantes e `attending` é `confirmed + plusOnes`. Convidado que ainda não respondeu não aparece, porque a API só conhece quem respondeu o convite.

As duas rotas só funcionam para o dono do evento (`404 Evento não encontrado` para evento de outro organizador, inexistente ou com `id` inválido) e saem com `Cache-Control: no-store`, porque trazem e-mail e telefone.

### Convite público (sem login)

`GET /invites/:slug` é a rota que a página do convite usa. Não precisa de token e devolve só o que o convidado pode ver:

```json
{
  "slug": "k3Jd9xQ_a1Zb",
  "title": "Casamento",
  "date": "2026-12-01",
  "location": "Rio de Janeiro",
  "description": "Venha celebrar com a gente",
  "layout": "basico"
}
```

Não devolve `id`, `organizerId`, `createdAt` nem dados de Pix. Slug inexistente, de formato inválido, trocado ou desativado devolve `404 Convite não encontrado`. A resposta sai com `Cache-Control: no-store`, para o link desativado parar de funcionar na hora.

### Confirmação de presença (sem login)

`POST /invites/:slug/rsvp` registra a resposta do convidado. Não precisa de token.

| Campo       | Regra                                                               |
| ----------- | ------------------------------------------------------------------- |
| `name`      | Obrigatório, até 120 caracteres                                     |
| `email`     | Obrigatório, e-mail válido, até 254 caracteres                      |
| `phone`     | Obrigatório, telefone brasileiro com DDD (10 ou 11 dígitos)         |
| `confirmed` | Obrigatório, `true` (vai) ou `false` (não vai)                      |
| `plusOne`   | Opcional (padrão `false`), `true` só vale se `confirmed` for `true` |

```json
{
  "name": "Ana Souza",
  "email": "ana@email.com",
  "phone": "(21) 98765-4321",
  "confirmed": true,
  "plusOne": true
}
```

Resposta `201`:

```json
{ "name": "Ana Souza", "confirmed": true, "plusOne": true }
```

O convidado é identificado pelo e-mail. O mesmo e-mail não confirma duas vezes no mesmo evento, ignorando maiúsculas e espaços, e a resposta é `409 Esse e-mail já confirmou presença`. Pessoas com o mesmo nome e e-mails diferentes são aceitas, e o mesmo e-mail pode confirmar em eventos diferentes. O telefone é salvo só com dígitos (o `+55` é removido).

E-mail e telefone são dados pessoais (LGPD). Eles não voltam na resposta da rota pública, e o front deve avisar o convidado de que os dados serão usados só para o evento. O convidado fica salvo em `events/{id}/guests`, e a data da confirmação sempre vem do servidor.

Erros: `400` para dados inválidos, `409` para e-mail repetido, e `404 Convite não encontrado` se o link não existe, foi trocado ou foi desativado.

### Proteções da API

- Corpo da requisição de até 16 KB. Acima disso a resposta é `413 Corpo da requisição grande demais`.
- JSON malformado devolve `400 JSON inválido`.
- As duas rotas públicas têm limite por IP em janelas de 15 minutos: `GET /invites/:slug` aceita 120 requisições e `POST /invites/:slug/rsvp` aceita 20. Passando disso a resposta é `429 Muitas requisições, tente novamente em alguns minutos`, com o header `Retry-After` em segundos. A contagem fica na memória de cada instância da Vercel, então ela reduz abuso simples, mas não é um bloqueio rígido.
- O header `X-Powered-By` fica desligado.

### Exemplo

```
curl -X POST https://SEU-APP.vercel.app/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Casamento", "date": "2026-12-01", "location": "Rio de Janeiro" }'
```

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
