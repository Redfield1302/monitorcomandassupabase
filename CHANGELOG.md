# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2025-06-14

### Adicionado
- API REST para recebimento de pedidos via HTTP
- Endpoint `/pedido` para receber novos pedidos em formato JSON
- Endpoint `/pedidos` para listar todos os pedidos recebidos
- Endpoint `/status` para verificar o status do servidor
- Endpoint administrativo `/pedidos` (DELETE) protegido por API Key
- Interface de usuário com carrossel de comandas usando Swiper.js
- Notificações sonoras para novos pedidos
- Animações visuais para destacar pedidos recentes
- Design responsivo para todos os dispositivos (desktop, tablet, mobile)
- Tema escuro automático para uso noturno
- Validação e sanitização de dados de entrada
- Proteção contra ataques comuns (rate limiting, validação de entrada)
- Configuração Docker completa (Dockerfile, docker-compose.yml)
- Suporte a variáveis de ambiente via arquivo .env
- Documentação detalhada de uso e deploy

### Segurança
- Validação de dados de entrada
- Sanitização de saída para prevenir XSS
- Rate limiting para prevenir abuso da API
- Proteção de endpoints administrativos via API Key
- Configuração CORS ajustável para ambiente de produção

### Técnico
- Backend em Node.js com Express
- Armazenamento em memória com limite configurável
- Frontend com HTML5, CSS3 e JavaScript moderno
- Comunicação assíncrona via Fetch API
- Containerização com Docker e Docker Compose
- Suporte a proxy reverso (Nginx)
