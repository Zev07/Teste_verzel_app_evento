# Modelagem de Dados — Plataforma de Eventos e Ingressos

## Visão geral

O domínio gira em torno de 3 papéis (Organizador, Cliente, Portaria) e do ciclo de vida
de um ingresso: **Evento → Reserva → Pagamento → Ingresso (QR) → Validação na portaria**.

Duas decisões estruturais guiaram o modelo:

1. **Reserva e Ingresso são entidades separadas.** Uma reserva representa a intenção
   de compra (pode ter N ingressos dentro, no modo "pista"); o ingresso é a unidade
   que carrega o QR e é validada individualmente na portaria.
2. **O mesmo lugar não pode ser vendido duas vezes.** Isso é garantido no banco via
   constraint de unicidade (`event_id + seat_label`), não só na aplicação — evita
   condição de corrida em concorrência.

## Escopo de reserva (MVP)

Implementando primeiro o modo **quantidade (pista)**: cliente escolhe evento e
quantidade de ingressos, sem seleção de assento específico. O modo **mapa de
assentos** (cinema/teatro) é tratado como evolução do mesmo modelo — a tabela
`seats` já está desenhada para suportar os dois modos sem migração destrutiva.

---

## Entidades

### `users`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| name | string | |
| email | string (unique) | |
| password_hash | string | |
| role | enum: `ORGANIZER`, `CLIENT`, `GATE` | define permissões |
| created_at | timestamp | |

**Decisão:** um único modelo de usuário com `role`, em vez de tabelas separadas por
papel. Simplifica auth (um JWT, um middleware de autorização por role) e é
suficiente pro escopo — não há campos que variem muito entre papéis.

---

### `events`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| external_id | string, nullable | id do show/filme na API externa (Ticketmaster/TMDb) |
| title | string | |
| type | enum: `SHOW`, `MOVIE` | |
| description | text, nullable | |
| image_url | string, nullable | |
| date | timestamp | |
| location | string | |
| capacity | int | total de ingressos disponíveis |
| price | decimal | preço base (modo pista) |
| reservation_mode | enum: `QUANTITY`, `SEAT_MAP` | define se usa `seats` |
| organizer_id | uuid (FK → users.id) | |
| status | enum: `PUBLISHED`, `CANCELLED` | |
| created_at | timestamp | |

---

### `seats` (usada apenas quando `reservation_mode = SEAT_MAP`)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| event_id | uuid (FK → events.id) | |
| label | string | ex: "A1", "B12" |
| status | enum: `AVAILABLE`, `RESERVED`, `SOLD` | |

**Constraint:** unique (`event_id`, `label`) — impede duplicar o mesmo assento pro
mesmo evento.

---

### `reservations`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| client_id | uuid (FK → users.id) | |
| event_id | uuid (FK → events.id) | |
| status | enum: `PENDING`, `PAID`, `DECLINED`, `CANCELLED` | |
| total_price | decimal | |
| quantity | int | nº de ingressos, no modo `QUANTITY` |
| created_at | timestamp | |

---

### `tickets`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| reservation_id | uuid (FK → reservations.id) | |
| event_id | uuid (FK → events.id) | redundante de propósito: valida rápido na portaria sem join |
| seat_id | uuid, nullable (FK → seats.id) | preenchido só no modo `SEAT_MAP` |
| qr_token | string (unique) | token assinado (HMAC), ver seção Segurança |
| status | enum: `VALID`, `USED`, `CANCELLED` | |
| used_at | timestamp, nullable | |
| validated_by | uuid, nullable (FK → users.id) | usuário da portaria que validou |
| created_at | timestamp | |

---

### `payments`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| reservation_id | uuid (FK → reservations.id, unique) | |
| status | enum: `APPROVED`, `DECLINED` | simulado |
| method | string | ex: "credit_card_simulado" |
| created_at | timestamp | |

---

### `ticket_shares`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| ticket_id | uuid (FK → tickets.id) | |
| token | string (unique) | usado no link público de compartilhamento |
| expires_at | timestamp, nullable | |
| created_at | timestamp | |

---

## Relacionamentos (resumo)

```
users (ORGANIZER) 1───N events
events            1───N seats            (opcional, modo SEAT_MAP)
users (CLIENT)    1───N reservations
events            1───N reservations
reservations      1───N tickets
seats             1───1 tickets          (opcional, nullable)
reservations      1───1 payments
tickets           1───N ticket_shares
users (GATE)      1───N tickets          (via validated_by)
```

## Regras de integridade críticas

- `seats(event_id, label)` **unique** → impede overselling de assento específico.
- Transação no momento da reserva: verificar disponibilidade + decrementar
  capacidade/marcar assento como `RESERVED` deve ocorrer numa única transação
  de banco (evita corrida entre dois clientes reservando ao mesmo tempo).
- `tickets.qr_token` **unique** e assinado com HMAC (`ticket_id + event_id + secret`)
  — impede forjar um QR válido sem o segredo do servidor.
- Validação na portaria: transição de status só é aceita se `status = VALID`;
  caso já esteja `USED`, retorna erro específico ("já utilizado"), nunca
  revalida silenciosamente.

## Fora do escopo do modelo (por decisão, não por esquecimento)

- Nota fiscal, revenda entre usuários — explicitamente fora do escopo do desafio.
- Envio de ingresso por e-mail — fora do escopo; o ingresso vive na área "Meus
  ingressos" e é compartilhável via link.
