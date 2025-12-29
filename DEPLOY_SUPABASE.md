# Monitor de Comandas v2.0 - Adaptado para Supabase (PostgreSQL)

Este projeto foi refatorado para utilizar o **PostgreSQL** do **Supabase** como banco de dados principal, substituindo a dependência anterior no Redis. Além disso, a estrutura de dados dos pedidos foi atualizada para um formato **JSON mais robusto**, conforme solicitado. O **frontend (`script.js`) também foi refatorado** para exibir corretamente os dados desta nova estrutura.

As novas funcionalidades incluem suporte a **múltiplos sabores** em itens de pizza e uma **rota de impressão** para comandas em impressoras térmicas.

## 🚀 Principais Alterações

| Componente | Antes | Depois |
| :--- | :--- | :--- |
| **Persistência de Dados** | Redis | PostgreSQL (Supabase) |
| **Estrutura de Pedido** | Campos simples (nome, tamanhoPizza, sabores) | Objeto JSON robusto (com suporte a `flavors` para múltiplos sabores) |
| **Lógica de Dados** | Funções de manipulação de Redis em `server.js` | Funções de manipulação de PostgreSQL em `db.js` |
| **Variáveis de Ambiente** | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | `DATABASE_URL` (String de conexão PostgreSQL) |

## 🛠️ Configuração e Deploy

O projeto agora está pronto para ser hospedado em qualquer plataforma que suporte aplicações Node.js (como Railway, Fly.io, Heroku, ou um VPS) e se conectar ao seu banco de dados Supabase.

### 1. Configuração do Supabase

1.  **Crie um Projeto Supabase:** Se ainda não tiver, crie um novo projeto no [Supabase Dashboard](https://app.supabase.com/).
2.  **Obtenha a URL de Conexão:**
    *   Vá para **Database** > **Connection String**.
    *   Copie a string de conexão no formato `postgres://[user]:[password]@[host]:[port]/[database_name]`.
3.  **Crie a Tabela `pedidos`:**
    *   A aplicação tentará criar a tabela automaticamente na inicialização, mas é uma boa prática criá-la manualmente ou garantir que o usuário de conexão tenha permissão para criar tabelas.
    *   A tabela deve ter a seguinte estrutura (SQL):

    ```sql
    CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        status VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        data JSONB NOT NULL
    );
    ```

    *   A coluna `data` armazena o objeto JSON completo do pedido, garantindo a flexibilidade da nova estrutura.

### 2. Variáveis de Ambiente

Crie um arquivo `.env` na pasta `monitor-comandas` (ou configure as variáveis de ambiente na sua plataforma de deploy) com as seguintes chaves:

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `PORT` | Porta de execução do servidor. | `3000` |
| `API_KEY` | Chave secreta para endpoints administrativos. | `sua_chave_secreta_aqui` |
| `DATABASE_URL` | String de conexão completa do PostgreSQL (Supabase). | `postgres://...` |

**NOTA:** O arquivo `.env.example` foi atualizado para refletir estas mudanças.

### 3. Execução Local

1.  Instale as dependências:
    ```bash
    cd monitor-comandas
    npm install
    ```
2.  Preencha o arquivo `.env` com sua `DATABASE_URL` do Supabase.
3.  Execute o servidor:
    ```bash
    npm start
    ```

## 📝 Nova Estrutura de Pedido (JSON)

A rota `POST /pedido` agora espera um corpo de requisição no formato JSON mais robusto. O **frontend (`script.js`) foi atualizado** para exibir corretamente os dados desta nova estrutura, incluindo a renderização de múltiplos sabores.

### 📝 Nova Rota de Impressão

Foi adicionada a rota `GET /pedido/:id/imprimir` que retorna o recibo formatado em texto simples (otimizado para impressoras térmicas de 40 colunas).

O frontend agora possui um botão **"Imprimir"** que chama esta rota e abre uma janela de impressão otimizada.

**Exemplo de JSON de Pedido (Esperado pela API e Usado pelo Frontend):**

**Nota sobre Múltiplos Sabores:** Para itens como pizza, inclua o array `flavors` dentro do item.

```json
"items": [
    {
      "name": "Pizza (Meia-Meia)",
      "quantity": 1,
      "unitPrice": 50.00,
      "totalPrice": 50.00,
      "notes": "Borda recheada",
      "flavors": [
        { "name": "Margherita", "portion": "1/2" },
        { "name": "Calabresa", "portion": "1/2" }
      ],
      "modifiers": []
    },
    // ... outros itens
]
```

```json
{
  "displayId": "5678",
  "sourcePlatform": "INTERNAL",
  "total": 35.00,
  "items": [
    {
      "name": "Pizza Margherita",
      "quantity": 1,
      "unitPrice": 35.00,
      "totalPrice": 35.00,
      "notes": "Sem cebola",
      "modifiers": [
        {
          "groupName": "Tamanho",
          "name": "Grande",
          "quantity": 1,
          "price": 0
        }
      ]
    }
  ],
  "customer": {
    "name": "João da Silva",
    "phone": "5511987654321",
    "address": "Rua Exemplo, 123 - Bairro"
  },
  "payment": {
    "method": "Cartão de Crédito",
    "changeFor": 0
  }
}
```

**Observação:** A função `validarPedido` em `server.js` implementa validação básica para a nova estrutura, incluindo a validação do array `flavors`. O frontend (`script.js`) agora extrai informações detalhadas dos objetos aninhados (`customer`, `items`, `payment`, `flavors`) para a exibição e impressão na comanda.

---
*Documento gerado por **Manus AI**.*

---
*Documento gerado por **Manus AI**.*
