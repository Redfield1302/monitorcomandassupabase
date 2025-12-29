# Changelog - Monitor de Comandas

## [2.0.0] - 2025-06-15

### Adicionado
- Atalho para WhatsApp com link direto no formato `https://wa.me/NUMERO`
- Atalho para Google Maps com localização do endereço do cliente
- Campo de observações para pedidos
- Botão "Finalizar" para marcar pedidos como concluídos
- Botão "Deletar" para remover pedidos específicos
- Persistência de dados com Redis
- Endpoint `/pedido/:id/finalizar` para marcar pedido como finalizado
- Endpoint `/pedido/:id` para deletar pedido específico
- Endpoint `/pedido/:id` (GET) para obter detalhes de um pedido específico
- Configuração Docker com Redis e volume para persistência
- Tema escuro automático para uso noturno
- Indicador de status de conexão com Redis no endpoint `/status`

### Alterado
- Campo `temRefrigerante` substituído por `bebida` (string em vez de booleano)
- Melhorias visuais na interface do carrossel
- Atualização do Docker Compose para incluir Redis
- Atualização do arquivo .env com variáveis para Redis
- Versão do package.json atualizada para 2.0.0
- Métodos CORS atualizados para incluir PUT

### Corrigido
- Tratamento de erros aprimorado em todas as operações
- Validação de dados ajustada para novos campos
- Sanitização de dados para evitar problemas de segurança

### Técnico
- Migração do armazenamento em memória para Redis
- Promisificação das operações Redis para uso com async/await
- Implementação de volumes Docker para persistência de dados
- Configuração de dependências entre serviços no Docker Compose
