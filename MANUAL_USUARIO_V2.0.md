# Manual do Usuário - Monitor de Comandas v2.0

## Introdução

O Monitor de Comandas é um sistema para visualização e gerenciamento de pedidos em tempo real, especialmente desenvolvido para pizzarias e estabelecimentos de delivery. Esta versão 2.0 traz diversas melhorias, incluindo persistência de dados com Redis, atalhos para WhatsApp e Google Maps, e novos botões de ação para gerenciar pedidos.

## Funcionalidades Principais

### 1. Visualização de Pedidos
- Carrossel interativo com todos os pedidos recebidos
- Destaque visual para pedidos novos
- Notificação sonora quando novos pedidos chegam
- Tema escuro automático para uso noturno

### 2. Atalhos de Comunicação
- **Atalho para WhatsApp**: Contate o cliente diretamente pelo WhatsApp com um clique
- **Atalho para Google Maps**: Visualize o endereço de entrega no Google Maps

### 3. Gerenciamento de Pedidos
- **Botão Finalizar**: Marque pedidos como concluídos
- **Botão Deletar**: Remova pedidos do sistema
- Visualização de observações especiais do cliente
- Informações detalhadas sobre bebidas (não apenas sim/não)

### 4. Persistência de Dados
- Armazenamento em banco de dados Redis
- Dados preservados mesmo após reinicialização do sistema
- Configuração Docker completa para ambiente de produção

## Como Usar

### Recebimento de Pedidos

O sistema recebe pedidos via API REST. Para enviar um pedido, faça uma requisição POST para `/pedido` com os seguintes dados:

```json
{
  "nome": "Nome do Cliente",
  "telefone": "(11) 98765-4321",
  "tamanhoPizza": "grande",
  "sabores": ["Margherita", "Calabresa"],
  "bebida": "Coca-Cola 2L",
  "endereco": "Rua das Flores, 123 - Centro",
  "formaPagamento": "Dinheiro",
  "observacoes": "Sem cebola, por favor."
}
```

### Ações Administrativas

Para realizar ações administrativas (finalizar ou deletar pedidos), você precisará da chave API configurada no arquivo `.env`. Esta chave deve ser enviada no cabeçalho `x-api-key` das requisições.

#### Finalizar um Pedido
1. Clique no botão "Finalizar" na comanda
2. Digite a chave API quando solicitado
3. O pedido será marcado como finalizado e destacado na interface

#### Deletar um Pedido
1. Clique no botão "Deletar" na comanda
2. Confirme a ação quando solicitado
3. Digite a chave API quando solicitado
4. O pedido será removido do sistema

## Instalação e Configuração

### Requisitos
- Docker e Docker Compose
- Node.js 14+ (para desenvolvimento local)

### Instalação com Docker

1. Clone o repositório:
   ```
   git clone [URL_DO_REPOSITORIO]
   cd monitor-comandas
   ```

2. Configure o arquivo `.env`:
   ```
   # Edite o arquivo .env conforme necessário
   nano .env
   ```

3. Inicie os containers:
   ```
   docker-compose up -d
   ```

4. Acesse o sistema:
   ```
   http://localhost:3000
   ```

### Variáveis de Ambiente

| Variável | Descrição | Valor Padrão |
|----------|-----------|--------------|
| PORT | Porta do servidor | 3000 |
| NODE_ENV | Ambiente (development/production) | development |
| API_KEY | Chave para operações administrativas | monitor_comandas_api_key_2025 |
| REDIS_HOST | Host do Redis | redis |
| REDIS_PORT | Porta do Redis | 6379 |
| REDIS_PASSWORD | Senha do Redis (opcional) | (vazio) |

## Endpoints da API

### Pedidos
- `POST /pedido` - Receber novo pedido
- `GET /pedidos` - Listar todos os pedidos
- `GET /pedido/:id` - Obter detalhes de um pedido específico
- `PUT /pedido/:id/finalizar` - Marcar pedido como finalizado (requer API Key)
- `DELETE /pedido/:id` - Deletar pedido específico (requer API Key)
- `DELETE /pedidos` - Limpar todos os pedidos (requer API Key)

### Sistema
- `GET /status` - Verificar status do servidor e Redis

## Solução de Problemas

### O sistema não mostra novos pedidos
- Verifique se o servidor está online (indicador de status na parte inferior)
- Confirme que o Redis está conectado (endpoint `/status`)
- Verifique os logs do container para erros

### Erro ao finalizar ou deletar pedidos
- Confirme que está usando a chave API correta
- Verifique se o Redis está funcionando corretamente
- Reinicie os containers se o problema persistir

### Notificações sonoras não funcionam
- Verifique se o navegador permite reprodução automática de áudio
- Clique no botão "Testar Som" para verificar as permissões

## Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contato com a equipe de desenvolvimento.

---

© 2025 Monitor de Comandas v2.0
