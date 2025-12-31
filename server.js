const express = require("express");
const { setupDatabase, salvarPedido, obterTodosPedidos, obterPedido, atualizarPedido, removerPedido, limparTodosPedidos, checkDbConnection } = require('./db');
const cors = require("cors");
const crypto = require("crypto");
// const redis = require("redis"); // Removido o Redis
// const { promisify } = require("util"); // Removido o Redis

const app = express();
const port = process.env.PORT || 3002;

// --- Configuração do Banco de Dados (PostgreSQL/Supabase) ---
// A configuração está em db.js. Vamos apenas garantir que a tabela exista.
setupDatabase();

// --- Middleware ---
// Configuração CORS mais restritiva
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://seu-dominio.com', 'https://www.seu-dominio.com'] 
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    maxAge: 86400
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1kb" }));
app.use(express.static('.'));

// Rate limiting simples
const requestCounts = {};
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;

app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requestCounts[ip] || now - requestCounts[ip].timestamp > RATE_LIMIT_WINDOW) {
        requestCounts[ip] = {
            count: 1,
            timestamp: now
        };
        return next();
    }
    
    requestCounts[ip].count++;
    
    if (requestCounts[ip].count > MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({ 
            erro: "Muitas requisições. Tente novamente em breve.",
            retryAfter: Math.ceil((requestCounts[ip].timestamp + RATE_LIMIT_WINDOW - now) / 1000)
        });
    }
    
    next();
});

// Chave de API para operações administrativas
const API_KEY = process.env.API_KEY || crypto.randomBytes(16).toString('hex');
console.log(`Chave de API gerada: ${API_KEY} (use esta chave para operações administrativas)`);

// As funções de manipulação de pedidos foram movidas para db.js e refatoradas para usar PostgreSQL.
// Elas serão importadas no início do arquivo.

// --- Validação e Sanitização (Adaptada para a nova estrutura JSON) ---
function validarPedido(dados) {
    const erros = [];
    
    // Validação básica da nova estrutura
    if (!dados.displayId || typeof dados.displayId !== "string" || dados.displayId.length > 50) {
        erros.push("displayId inválido ou ausente (máx 50 caracteres).");
    }
    if (!dados.sourcePlatform || typeof dados.sourcePlatform !== "string" || dados.sourcePlatform.length > 50) {
        erros.push("sourcePlatform inválido ou ausente (máx 50 caracteres).");
    }
    if (typeof dados.total !== "number" || dados.total <= 0) {
        erros.push("Total inválido ou ausente.");
    }
    if (!Array.isArray(dados.items) || dados.items.length === 0) {
        erros.push("Items inválidos ou ausentes.");
    } else {
        // Validação dos itens (simplificada)
        dados.items.forEach((item, index) => {
            if (!item.name || typeof item.name !== "string" || item.name.length > 100) {
                erros.push(`Item ${index + 1}: Nome inválido.`);
            }
            if (typeof item.quantity !== "number" || item.quantity <= 0) {
                erros.push(`Item ${index + 1}: Quantidade inválida.`);
            }
            
            // Validação para múltiplos sabores (flavors)
            if (item.flavors && !Array.isArray(item.flavors)) {
                erros.push(`Item ${index + 1}: Campo 'flavors' deve ser um array.`);
            } else if (item.flavors && item.flavors.length > 0) {
                item.flavors.forEach((flavor, fIndex) => {
                    if (!flavor.name || typeof flavor.name !== "string" || flavor.name.length > 50) {
                        erros.push(`Item ${index + 1}, Sabor ${fIndex + 1}: Nome do sabor inválido.`);
                    }
                    if (!flavor.portion || typeof flavor.portion !== "string" || !["1/2", "1/3", "1/4", "inteira"].includes(flavor.portion.toLowerCase())) {
                        erros.push(`Item ${index + 1}, Sabor ${fIndex + 1}: Porção inválida (esperado: 1/2, 1/3, 1/4, inteira).`);
                    }
                });
            }
        });
    }

    // Adicionar validações de campos que podem ser importantes para o restaurante (ex: endereço, telefone)
    // Assumindo que esses campos virão em um nível superior ou em um campo 'customer' no JSON
    // Se o JSON de exemplo for o corpo completo, vamos assumir que as informações de contato/entrega virão em campos adicionais no corpo da requisição, como antes.
    
    // Se você precisar de campos de contato/entrega, eles devem ser adicionados ao JSON de entrada.
    // Por exemplo, se o JSON de entrada for: { ...novo_json, customer: { nome: "...", telefone: "...", endereco: "..." } }
    
    // Por enquanto, vamos manter a validação focada na estrutura que você forneceu.
    
    return erros;
}

// Middleware para verificar API Key
function verificarApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({ erro: "Acesso não autorizado. API Key inválida." });
    }
    
    next();
}

// --- Funções Auxiliares ---

/**
 * Formata um pedido em texto simples para impressão em impressora térmica.
 * @param {object} pedido - O objeto de pedido completo.
 * @returns {string} O recibo formatado em texto.
 */
function formatarReciboTexto(pedido) {
    const MAX_WIDTH = 40; // Largura típica de uma impressora térmica de 80mm (40 caracteres)
    const SEPARATOR = '-'.repeat(MAX_WIDTH);
    const DOUBLE_SEPARATOR = '='.repeat(MAX_WIDTH);
    
    // Função para centralizar texto
    const centerText = (text) => {
        const padding = Math.max(0, Math.floor((MAX_WIDTH - text.length) / 2));
        return ' '.repeat(padding) + text + ' '.repeat(padding);
    };
    
    // Função para alinhar esquerda e direita
    const alignText = (left, right) => {
        const space = Math.max(1, MAX_WIDTH - left.length - right.length);
        return left + ' '.repeat(space) + right;
    };
    
    let recibo = '';
    
    // Cabeçalho
    recibo += centerText('COMANDA DE PEDIDO') + '\n';
    recibo += centerText('Monitor de Comandas v2.0') + '\n';
    recibo += DOUBLE_SEPARATOR + '\n';
    
    // Informações do Pedido
    recibo += alignText('Pedido #:', pedido.id.toString()) + '\n';
    recibo += alignText('ID Externo:', pedido.displayId || 'N/A') + '\n';
    recibo += alignText('Status:', pedido.status.toUpperCase()) + '\n';
    recibo += alignText('Data/Hora:', new Date(pedido.timestamp).toLocaleString('pt-BR')) + '\n';
    recibo += SEPARATOR + '\n';
    
    // Informações do Cliente
    const customer = pedido.customer || {};
    recibo += centerText('DADOS DO CLIENTE') + '\n';
    recibo += alignText('Nome:', customer.name || 'N/A') + '\n';
    recibo += alignText('Telefone:', customer.phone || 'N/A') + '\n';
    recibo += alignText('Endereço:', customer.address || 'N/A') + '\n';
    recibo += SEPARATOR + '\n';
    
    // Itens do Pedido
    recibo += centerText('ITENS') + '\n';
    
    (pedido.items || []).forEach(item => {
        const itemQty = item.quantity || 1;
        const itemPrice = item.totalPrice || 0;
        
        recibo += alignText(`${itemQty}x ${item.name}`, `R$ ${itemPrice.toFixed(2)}`) + '\n';
        
        // Sabores (Flavors)
        (item.flavors || []).forEach(flavor => {
            recibo += `  - ${flavor.portion} de ${flavor.name}\n`;
        });
        
        // Modificadores
        (item.modifiers || []).forEach(mod => {
            const modPrice = mod.price && mod.price > 0 ? ` (+R$ ${mod.price.toFixed(2)})` : '';
            recibo += `  + ${mod.groupName}: ${mod.name}${modPrice}\n`;
        });
        
        // Observações do Item
        if (item.notes) {
            recibo += `  Obs: ${item.notes}\n`;
        }
    });
    
    recibo += SEPARATOR + '\n';
    
    // Totais
    const payment = pedido.payment || {};
    const total = pedido.total || 0;
    
    recibo += alignText('SUBTOTAL:', `R$ ${total.toFixed(2)}`) + '\n';
    recibo += alignText('TAXA DE ENTREGA:', 'R$ 0.00') + '\n'; // Assumindo 0 por padrão
    recibo += DOUBLE_SEPARATOR + '\n';
    recibo += alignText('TOTAL GERAL:', `R$ ${total.toFixed(2)}`) + '\n';
    recibo += DOUBLE_SEPARATOR + '\n';
    
    // Pagamento
    recibo += centerText('PAGAMENTO') + '\n';
    recibo += alignText('Método:', payment.method || 'N/A') + '\n';
    
    if (payment.changeFor && payment.changeFor > total) {
        recibo += alignText('Troco para:', `R$ ${payment.changeFor.toFixed(2)}`) + '\n';
        recibo += alignText('Seu Troco:', `R$ ${(payment.changeFor - total).toFixed(2)}`) + '\n';
    }
    
    recibo += SEPARATOR + '\n';
    
    // Observações Gerais
    if (pedido.notes || pedido.observacoes) {
        recibo += centerText('OBSERVAÇÕES GERAIS') + '\n';
        recibo += (pedido.notes || pedido.observacoes) + '\n';
        recibo += SEPARATOR + '\n';
    }
    
    // Rodapé
    recibo += centerText('OBRIGADO PELA PREFERÊNCIA!') + '\n';
    recibo += '\n\n\n'; // Espaço para corte da impressora
    
    return recibo;
}

// --- Rotas ---

// POST /pedido - Receber novo pedido
app.post("/pedido", async (req, res) => {
    try {
        // Verifica se o corpo da requisição existe
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ erro: "Corpo da requisição vazio ou inválido." });
        }

        const errosValidacao = validarPedido(req.body);
        if (errosValidacao.length > 0) {
            console.warn("Tentativa de pedido inválido:", errosValidacao);
            return res.status(400).json({ erro: "Dados inválidos no pedido.", detalhes: errosValidacao });
        }
        
        // O corpo da requisição (req.body) agora é o objeto de pedido completo no novo formato JSON.
        const novoPedido = req.body;

        // A função salvarPedido agora cuida de salvar o JSONB no banco de dados.
        const pedidoSalvo = await salvarPedido(novoPedido);
        
        // O pedidoSalvo já inclui o ID, status e timestamp gerados pelo banco.
        console.log(`Pedido recebido: ID ${pedidoSalvo.id} - Display ID ${pedidoSalvo.displayId}`);
        res.status(201).json(pedidoSalvo);
    } catch (error) {
        console.error("Erro ao processar pedido:", error);
        res.status(500).json({ erro: "Erro interno ao processar pedido." });
    }
});

// GET /pedidos - Obter todos os pedidos
app.get("/pedidos", async (req, res) => {
    try {
        // A função obterTodosPedidos já retorna os pedidos ordenados por timestamp DESC
        const pedidos = await obterTodosPedidos();
        res.status(200).json(pedidos);
    } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
        res.status(500).json({ erro: "Erro interno ao buscar pedidos." });
    }
});

// DELETE /pedidos - Limpar pedidos (protegido por API Key)
app.delete("/pedidos", verificarApiKey, async (req, res) => {
    try {
        await limparTodosPedidos();
        console.log("Lista de pedidos limpa.");
        res.status(200).json({ mensagem: "Lista de pedidos limpa com sucesso." });
    } catch (error) {
        console.error("Erro ao limpar pedidos:", error);
        res.status(500).json({ erro: "Erro interno ao limpar pedidos." });
    }
});

// PUT /pedido/:id/finalizar - Marcar pedido como finalizado
app.put("/pedido/:id/finalizar", verificarApiKey, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const pedidoAtualizado = await atualizarPedido(id, {
            status: "finalizado",
            finalizadoEm: new Date().toISOString()
        });
        
        if (!pedidoAtualizado) {
            return res.status(404).json({ erro: "Pedido não encontrado." });
        }
        
        console.log(`Pedido #${id} marcado como finalizado.`);
        res.status(200).json(pedidoAtualizado);
    } catch (error) {
        console.error("Erro ao finalizar pedido:", error);
        res.status(500).json({ erro: "Erro interno ao finalizar pedido." });
    }
});

// DELETE /pedido/:id - Deletar um pedido específico
app.delete("/pedido/:id", verificarApiKey, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const pedidoRemovido = await removerPedido(id);
        
        if (!pedidoRemovido) {
            return res.status(404).json({ erro: "Pedido não encontrado." });
        }
        
        console.log(`Pedido #${id} removido.`);
        res.status(200).json({ mensagem: "Pedido removido com sucesso.", pedido: pedidoRemovido });
    } catch (error) {
        console.error("Erro ao remover pedido:", error);
        res.status(500).json({ erro: "Erro interno ao remover pedido." });
    }
});

// GET /pedido/:id - Obter um pedido específico
app.get("/pedido/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const pedido = await obterPedido(id);
        
        if (!pedido) {
            return res.status(404).json({ erro: "Pedido não encontrado." });
        }
        
        res.status(200).json(pedido);
    } catch (error) {
        console.error("Erro ao buscar pedido:", error);
        res.status(500).json({ erro: "Erro interno ao buscar pedido." });
    }
});

// GET /pedido/:id/imprimir - Gerar recibo em texto simples para impressão
app.get("/pedido/:id/imprimir", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const pedido = await obterPedido(id);
        
        if (!pedido) {
            return res.status(404).json({ erro: "Pedido não encontrado." });
        }
        
        // Função que será implementada na próxima fase
        const reciboTexto = formatarReciboTexto(pedido); 
        
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(200).send(reciboTexto);
    } catch (error) {
        console.error("Erro ao gerar recibo:", error);
        res.status(500).json({ erro: "Erro interno ao gerar recibo." });
    }
});

// Rota para verificar status do servidor
app.get("/status", async (req, res) => {
    try {
        const dbConnected = await checkDbConnection();
        const pedidos = await obterTodosPedidos();
        res.status(200).json({ 
            status: "online", 
            timestamp: new Date().toISOString(),
            pedidosAtivos: pedidos.length,
            versao: "2.0.0",
            database: dbConnected ? "conectado (PostgreSQL)" : "desconectado (PostgreSQL)"
        });
    } catch (error) {
        console.error("Erro ao verificar status:", error);
        res.status(500).json({ 
            status: "erro", 
            erro: "Erro ao verificar status do servidor.",
            versao: "2.0.0"
        });
    }
});

// --- Tratamento de Erros ---

// Rota não encontrada (404)
app.use((req, res, next) => {
    res.status(404).json({ erro: "Rota não encontrada." });
});

// Erro genérico (500)
app.use((err, req, res, next) => {
    console.error("Erro inesperado:", err.stack);
    // Evitar vazar detalhes do erro em produção
    res.status(500).json({ erro: "Ocorreu um erro interno no servidor." });
});

// --- Inicialização ---
// A função setupDatabase() é chamada no início para garantir a tabela.
app.listen(port,'0.0.0.0', () => {
    console.log(`Servidor do Monitor de Comandas v2.0 rodando em http://localhost:${port}`);
    console.log(`Acesse o monitor em http://localhost:${port}/index.html`);
});
