# Proposta de Melhorias para Monitor de Comandas v2.0

## Visão Geral

Este documento detalha as melhorias planejadas para a versão 2.0 do Monitor de Comandas, com base nos requisitos fornecidos pelo cliente.

## Requisitos Coletados

1. **Atalho para WhatsApp**: Adicionar ícone com link direto para WhatsApp do cliente
2. **Atalho para Google Maps**: Adicionar ícone para localização no Google Maps
3. **Ajuste no formato de dados**: Alterar campo de bebida de booleano para string
4. **Campo de observações**: Adicionar campo para observações do pedido
5. **Novos botões de ação**: Implementar botões "Finalizado" e "Deletar Pedido"
6. **Persistência de dados**: Migrar para banco de dados Redis

## Detalhamento das Melhorias

### 1. Atalho para WhatsApp

#### Descrição
Adicionar um ícone clicável que abre o WhatsApp diretamente para o número do cliente, usando o formato `https://wa.me/NUMERO`.

#### Implementação
- Adicionar ícone do WhatsApp na interface de cada comanda
- Formatar o link no padrão `https://wa.me/5571981342310` (exemplo)
- Remover caracteres especiais do número de telefone antes de gerar o link
- Abrir em nova aba ao clicar

#### Mudanças no Código
```javascript
// No arquivo script.js, função criarComandaHTML
function criarComandaHTML(pedido) {
    // Código existente...
    
    // Formatar número para WhatsApp (remover caracteres especiais)
    const telefoneWhatsApp = telefone.replace(/\D/g, '');
    const whatsappLink = `https://wa.me/${telefoneWhatsApp}`;
    
    // Adicionar ícone na interface
    const whatsappButton = `<a href="${whatsappLink}" target="_blank" class="btn-whatsapp" title="Contatar via WhatsApp"><i class="fa fa-whatsapp"></i></a>`;
    
    // Incluir no HTML da comanda
    // ...
}
```

### 2. Atalho para Google Maps

#### Descrição
Adicionar um ícone clicável que abre o Google Maps com o endereço do cliente.

#### Implementação
- Adicionar ícone do Google Maps na interface de cada comanda
- Codificar o endereço para URL
- Abrir em nova aba ao clicar

#### Mudanças no Código
```javascript
// No arquivo script.js, função criarComandaHTML
function criarComandaHTML(pedido) {
    // Código existente...
    
    // Codificar endereço para URL
    const enderecoMaps = encodeURIComponent(endereco);
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${enderecoMaps}`;
    
    // Adicionar ícone na interface
    const mapsButton = `<a href="${mapsLink}" target="_blank" class="btn-maps" title="Ver no Google Maps"><i class="fa fa-map-marker"></i></a>`;
    
    // Incluir no HTML da comanda
    // ...
}
```

### 3. Ajuste no Formato de Dados (Bebida)

#### Descrição
Alterar o campo `temRefrigerante` de booleano para string, permitindo especificar qual bebida foi pedida.

#### Implementação
- Modificar o modelo de dados no backend
- Atualizar a validação de entrada
- Ajustar a interface para exibir o texto da bebida

#### Mudanças no Código
```javascript
// No arquivo server.js, função validarPedido
function validarPedido(dados) {
    const erros = [];
    // Código existente...
    
    // Validação de bebida como string em vez de booleano
    if (dados.bebida !== undefined && typeof dados.bebida !== "string") {
        erros.push("Campo 'bebida' deve ser uma string.");
    }
    
    // Resto do código...
    return erros;
}

// No processamento do pedido
const novoPedido = {
    // Campos existentes...
    bebida: req.body.bebida || "", // String vazia se não especificado
    // Resto dos campos...
};
```

### 4. Campo de Observações

#### Descrição
Adicionar um campo para observações do cliente sobre o pedido.

#### Implementação
- Adicionar campo `observacoes` no modelo de dados
- Atualizar a validação de entrada
- Exibir as observações na interface da comanda

#### Mudanças no Código
```javascript
// No arquivo server.js, função validarPedido
function validarPedido(dados) {
    const erros = [];
    // Código existente...
    
    // Validação opcional para observações
    if (dados.observacoes && typeof dados.observacoes !== "string") {
        erros.push("Campo 'observacoes' deve ser uma string.");
    } else if (dados.observacoes && dados.observacoes.length > 200) {
        erros.push("Observações muito longas (máx 200 caracteres).");
    }
    
    // Resto do código...
    return erros;
}

// No processamento do pedido
const novoPedido = {
    // Campos existentes...
    observacoes: req.body.observacoes ? req.body.observacoes.trim().substring(0, 200) : "",
    // Resto dos campos...
};
```

### 5. Novos Botões de Ação

#### Descrição
Adicionar botões "Finalizado" e "Deletar Pedido" para gerenciar o ciclo de vida dos pedidos.

#### Implementação
- Adicionar botões na interface de cada comanda
- Implementar endpoints no backend para estas ações
- Atualizar o estado em tempo real na interface

#### Mudanças no Código
```javascript
// No arquivo server.js, novas rotas
// Marcar pedido como finalizado
app.put("/pedido/:id/finalizar", verificarApiKey, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const pedidoIndex = pedidos.findIndex(p => p.id === id);
        
        if (pedidoIndex === -1) {
            return res.status(404).json({ erro: "Pedido não encontrado." });
        }
        
        pedidos[pedidoIndex].status = "finalizado";
        pedidos[pedidoIndex].finalizadoEm = new Date();
        
        console.log(`Pedido #${id} marcado como finalizado.`);
        res.status(200).json(pedidos[pedidoIndex]);
    } catch (error) {
        console.error("Erro ao finalizar pedido:", error);
        res.status(500).json({ erro: "Erro interno ao finalizar pedido." });
    }
});

// Deletar um pedido específico
app.delete("/pedido/:id", verificarApiKey, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const pedidoIndex = pedidos.findIndex(p => p.id === id);
        
        if (pedidoIndex === -1) {
            return res.status(404).json({ erro: "Pedido não encontrado." });
        }
        
        const pedidoRemovido = pedidos.splice(pedidoIndex, 1)[0];
        
        console.log(`Pedido #${id} removido.`);
        res.status(200).json({ mensagem: "Pedido removido com sucesso.", pedido: pedidoRemovido });
    } catch (error) {
        console.error("Erro ao remover pedido:", error);
        res.status(500).json({ erro: "Erro interno ao remover pedido." });
    }
});
```

### 6. Persistência de Dados com Redis

#### Descrição
Migrar do armazenamento em memória para o banco de dados Redis.

#### Implementação
- Adicionar Redis como dependência
- Configurar conexão com Redis
- Implementar funções para salvar e recuperar pedidos
- Manter compatibilidade com a API existente

#### Mudanças no Código
```javascript
// No arquivo server.js, adicionar Redis
const redis = require('redis');
const { promisify } = require('util');

// Configuração do cliente Redis
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
});

// Promisify para uso com async/await
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);
const keysAsync = promisify(redisClient.keys).bind(redisClient);

// Manipulação de erros do Redis
redisClient.on('error', (err) => {
    console.error('Erro no Redis:', err);
});

// Funções para manipular pedidos no Redis
async function salvarPedido(pedido) {
    try {
        await setAsync(`pedido:${pedido.id}`, JSON.stringify(pedido));
        // Manter um índice de IDs para facilitar a listagem
        const ids = await getAsync('pedidos:ids') || '[]';
        const idsArray = JSON.parse(ids);
        if (!idsArray.includes(pedido.id)) {
            idsArray.push(pedido.id);
            await setAsync('pedidos:ids', JSON.stringify(idsArray));
        }
    } catch (error) {
        console.error('Erro ao salvar pedido no Redis:', error);
        throw error;
    }
}

async function obterTodosPedidos() {
    try {
        const ids = await getAsync('pedidos:ids') || '[]';
        const idsArray = JSON.parse(ids);
        const pedidos = [];
        
        for (const id of idsArray) {
            const pedidoStr = await getAsync(`pedido:${id}`);
            if (pedidoStr) {
                pedidos.push(JSON.parse(pedidoStr));
            }
        }
        
        return pedidos;
    } catch (error) {
        console.error('Erro ao obter pedidos do Redis:', error);
        throw error;
    }
}

async function removerPedido(id) {
    try {
        // Remover o pedido
        await delAsync(`pedido:${id}`);
        
        // Atualizar o índice de IDs
        const ids = await getAsync('pedidos:ids') || '[]';
        const idsArray = JSON.parse(ids);
        const novoArray = idsArray.filter(pedidoId => pedidoId !== id);
        await setAsync('pedidos:ids', JSON.stringify(novoArray));
    } catch (error) {
        console.error('Erro ao remover pedido do Redis:', error);
        throw error;
    }
}

// Modificar as rotas para usar Redis
app.post("/pedido", async (req, res) => {
    try {
        // Validação existente...
        
        const novoPedido = {
            id: Date.now(), // Usar timestamp como ID
            timestamp: new Date(),
            // Outros campos...
        };
        
        await salvarPedido(novoPedido);
        res.status(201).json(novoPedido);
    } catch (error) {
        console.error("Erro ao processar pedido:", error);
        res.status(500).json({ erro: "Erro interno ao processar pedido." });
    }
});

app.get("/pedidos", async (req, res) => {
    try {
        const pedidos = await obterTodosPedidos();
        // Ordenar do mais recente para o mais antigo
        pedidos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.status(200).json(pedidos);
    } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
        res.status(500).json({ erro: "Erro interno ao buscar pedidos." });
    }
});
```

## Mudanças no Docker Compose

Adicionar Redis ao arquivo docker-compose.yml:

```yaml
version: '3.8'

services:
  monitor-comandas:
    build: .
    container_name: monitor_comandas_app
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
    networks:
      - monitor-net
    depends_on:
      - redis

  redis:
    image: redis:alpine
    container_name: monitor_comandas_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - monitor-net
    command: redis-server --appendonly yes

networks:
  monitor-net:
    driver: bridge

volumes:
  redis-data:
```

## Mudanças no arquivo .env

```
PORT=3000
NODE_ENV=production
API_KEY=sua_chave_api_segura_aqui

# Configurações Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Mudanças no package.json

```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^5.1.0",
    "redis": "^3.1.2"
  }
}
```

## Cronograma de Implementação

1. **Fase 1**: Ajustes no modelo de dados (bebida como string, campo de observações)
2. **Fase 2**: Implementação dos botões de ação (finalizar e deletar)
3. **Fase 3**: Adição dos atalhos (WhatsApp e Google Maps)
4. **Fase 4**: Migração para Redis
5. **Fase 5**: Testes e ajustes finais

## Impacto nas Versões Anteriores

- A API terá mudanças que não são retrocompatíveis (breaking changes)
- Será necessário atualizar os clientes que consomem a API
- Os dados armazenados na versão anterior (em memória) não serão migrados automaticamente
