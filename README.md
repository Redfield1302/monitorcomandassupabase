# Monitor de Comandas para Pizzaria

Um sistema simples e eficiente para exibir comandas de pedidos em tempo real, ideal para uso em cozinhas de restaurantes e pizzarias.

## Características

- **Recebimento de Pedidos via HTTP**: API REST para receber pedidos em formato JSON
- **Exibição em Carrossel**: Interface visual atraente com carrossel de comandas
- **Notificações em Tempo Real**: Som e animações visuais para novos pedidos
- **Design Responsivo**: Funciona em qualquer dispositivo (computadores, tablets, TVs)
- **Modo Escuro Automático**: Adapta-se automaticamente ao período noturno
- **Segurança Básica**: Validação de dados, sanitização e proteção contra ataques comuns

## Requisitos

- Node.js (v14 ou superior)
- NPM ou Yarn
- Navegador web moderno

## Instalação

1. Clone ou baixe este repositório
2. Instale as dependências:

```bash
cd monitor-comandas
npm install
```

## Executando o Sistema

### Desenvolvimento Local

```bash
npm start
```

O servidor estará disponível em `http://localhost:3000` e o monitor de comandas em `http://localhost:3000/index.html`

### Produção

Para ambiente de produção, recomenda-se:

1. Configurar variáveis de ambiente:
   - `PORT`: Porta do servidor (padrão: 3000)
   - `NODE_ENV`: Ambiente ('production' para produção)
   - `API_KEY`: Chave de API para operações administrativas (gerada automaticamente se não fornecida)

2. Iniciar com PM2 ou similar:

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar o servidor
pm2 start server.js --name monitor-comandas
```

## Enviando Pedidos para o Sistema

Os pedidos devem ser enviados via POST para o endpoint `/pedido` no formato JSON:

```json
{
  "nome": "Nome do Cliente",
  "telefone": "(11) 98765-4321",
  "tamanhoPizza": "grande",
  "sabores": ["Margherita", "Calabresa"],
  "temRefrigerante": true,
  "endereco": "Rua Exemplo, 123 - Bairro",
  "formaPagamento": "Cartão de Crédito"
}
```

### Exemplo com cURL

```bash
curl -X POST http://localhost:3000/pedido \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Silva",
    "telefone": "(11) 98765-4321",
    "tamanhoPizza": "grande",
    "sabores": ["Margherita", "Calabresa"],
    "temRefrigerante": true,
    "endereco": "Rua das Flores, 123 - Centro",
    "formaPagamento": "Dinheiro"
  }'
```

### Exemplo com JavaScript/Fetch

```javascript
const pedido = {
  nome: "João Santos",
  telefone: "(11) 91234-5678",
  tamanhoPizza: "Media",
  sabores: ["4 Queijos", "Portuguesa"],
  temRefrigerante: false,
  endereco: "Av. Principal, 456 - Jardim",
  formaPagamento: "PIX"
};

fetch('http://localhost:3000/pedido', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(pedido)
})
.then(response => response.json())
.then(data => console.log('Pedido enviado:', data))
.catch(error => console.error('Erro:', error));
```

## Endpoints da API

- `POST /pedido`: Recebe um novo pedido
- `GET /pedidos`: Lista todos os pedidos (mais recentes primeiro)
- `DELETE /pedidos`: Limpa todos os pedidos (requer API Key)
- `GET /status`: Verifica status do servidor

## Segurança

O endpoint `DELETE /pedidos` é protegido por uma chave de API que é gerada automaticamente ao iniciar o servidor (visível no console) ou pode ser definida via variável de ambiente `API_KEY`.

Para usar este endpoint, inclua o cabeçalho `x-api-key` com o valor da chave:

```bash
curl -X DELETE http://localhost:3000/pedidos \
  -H "x-api-key: sua-chave-api-aqui"
```

## Personalização

### Cores e Estilos

Edite o arquivo `style.css` para personalizar as cores e aparência do monitor.

### Intervalo de Atualização

O intervalo padrão para buscar novos pedidos é de 10 segundos. Você pode alterar isso no arquivo `script.js` modificando o valor da variável `intervaloBusca`.

## Solução de Problemas

### O servidor não inicia

Verifique se a porta 3000 não está sendo usada por outro processo:
```bash
lsof -i :3000
```

### Não consigo enviar pedidos

Verifique se o servidor está rodando e se o formato do JSON está correto.

### O som de notificação não funciona

Os navegadores modernos exigem interação do usuário antes de permitir a reprodução automática de áudio. Clique em qualquer lugar da página antes de receber o primeiro pedido.

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.



## Executando com Docker

Este projeto está configurado para ser executado facilmente com Docker e Docker Compose.

### Requisitos Docker

- Docker
- Docker Compose

### Configuração

1.  **Arquivo `.env`**: Antes de iniciar, revise e ajuste o arquivo `.env` na raiz do projeto. Ele contém variáveis importantes:
    - `PORT`: Porta interna do container (geralmente não precisa mudar).
    - `NODE_ENV`: Defina como `production` para ambiente de produção (ativa CORS mais restritivo).
    - `API_KEY`: Defina uma chave segura para proteger o endpoint `DELETE /pedidos`. Se deixada em branco, uma chave aleatória será gerada e exibida no log ao iniciar.

### Comandos Docker Compose

1.  **Construir e Iniciar (em background):**

    ```bash
    docker-compose up --build -d
    ```

2.  **Ver Logs:**

    ```bash
    docker-compose logs -f
    ```

3.  **Parar e Remover Containers:**

    ```bash
    docker-compose down
    ```

4.  **Acessar o Monitor:**
    Após iniciar, acesse `http://localhost:3000/index.html` no seu navegador.

### Notas sobre Docker

- O `docker-compose.yml` mapeia a porta 3000 do seu host para a porta 3000 do container.
- As variáveis do arquivo `.env` são carregadas automaticamente.
- Um volume para logs (`./logs`) é configurado, mas o aplicativo atual não grava logs em arquivo por padrão.

