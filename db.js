const { Pool } = require('pg');
require('dotenv').config();

// Configuração da conexão com o PostgreSQL (Supabase)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Necessário para alguns ambientes de hospedagem como o Supabase
    }
});

// Função para garantir que a tabela 'pedidos' exista
async function setupDatabase() {
    try {
        const client = await pool.connect();
        const query = `
            CREATE TABLE IF NOT EXISTS pedidos (
                id SERIAL PRIMARY KEY,
                status VARCHAR(50) NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                data JSONB NOT NULL
            );
        `;
        await client.query(query);
        client.release();
        console.log("Tabela 'pedidos' verificada/criada com sucesso.");
    } catch (error) {
        console.error("Erro ao configurar o banco de dados:", error);
        // Em um ambiente real, você pode querer encerrar o processo aqui
    }
}

// --- Funções de Manipulação de Pedidos (CRUD) ---

/**
 * Salva um novo pedido no banco de dados.
 * @param {object} novoPedido - O objeto de pedido no novo formato JSON.
 * @returns {object} O pedido salvo com o ID.
 */
async function salvarPedido(novoPedido) {
    const client = await pool.connect();
    try {
        // O status inicial será 'recebido' e o timestamp será gerado pelo banco
        const status = 'recebido';
        const dataJson = JSON.stringify(novoPedido);
        
        const query = `
            INSERT INTO pedidos (status, data)
            VALUES ($1, $2)
            RETURNING id, status, timestamp, data;
        `;
        const res = await client.query(query, [status, dataJson]);
        
        // Retorna o pedido completo, incluindo o ID gerado
        return {
            id: res.rows[0].id,
            status: res.rows[0].status,
            timestamp: res.rows[0].timestamp,
            ...res.rows[0].data // Espalha o conteúdo do JSONB
        };
    } finally {
        client.release();
    }
}

/**
 * Obtém todos os pedidos.
 * @returns {Array<object>} Lista de pedidos.
 */
async function obterTodosPedidos() {
    const client = await pool.connect();
    try {
        // Seleciona todos os campos, incluindo o JSONB 'data'
        const query = `
            SELECT id, status, timestamp, data
            FROM pedidos
            ORDER BY timestamp DESC;
        `;
        const res = await client.query(query);
        
        // Mapeia os resultados para o formato desejado
        return res.rows.map(row => ({
            id: row.id,
            status: row.status,
            timestamp: row.timestamp,
            ...row.data // Espalha o conteúdo do JSONB
        }));
    } finally {
        client.release();
    }
}

/**
 * Obtém um pedido específico pelo ID.
 * @param {number} id - O ID do pedido.
 * @returns {object|null} O pedido ou null se não encontrado.
 */
async function obterPedido(id) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT id, status, timestamp, data
            FROM pedidos
            WHERE id = $1;
        `;
        const res = await client.query(query, [id]);
        
        if (res.rows.length === 0) {
            return null;
        }
        
        const row = res.rows[0];
        return {
            id: row.id,
            status: row.status,
            timestamp: row.timestamp,
            ...row.data // Espalha o conteúdo do JSONB
        };
    } finally {
        client.release();
    }
}

/**
 * Atualiza o status de um pedido.
 * @param {number} id - O ID do pedido.
 * @param {object} updates - Objeto com as atualizações (ex: { status: 'finalizado', finalizadoEm: '...' }).
 * @returns {object|null} O pedido atualizado ou null se não encontrado.
 */
async function atualizarPedido(id, updates) {
    const client = await pool.connect();
    try {
        // Prepara a query de atualização
        let setClauses = [];
        let values = [];
        let paramIndex = 1;

        // Atualiza o status e o timestamp de finalização (se aplicável)
        if (updates.status) {
            setClauses.push(`status = $${paramIndex++}`);
            values.push(updates.status);
        }
        
        // Se houver outras atualizações que devem ir para o JSONB 'data', elas devem ser tratadas com JSONB_SET
        // Para simplificar, vamos focar apenas na atualização do status, que é um campo de controle.
        
        if (setClauses.length === 0) {
            return obterPedido(id); // Nada para atualizar
        }

        values.push(id); // O último valor é o ID
        
        const query = `
            UPDATE pedidos
            SET ${setClauses.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, status, timestamp, data;
        `;
        
        const res = await client.query(query, values);
        
        if (res.rows.length === 0) {
            return null;
        }
        
        const row = res.rows[0];
        return {
            id: row.id,
            status: row.status,
            timestamp: row.timestamp,
            ...row.data
        };
    } finally {
        client.release();
    }
}

/**
 * Remove um pedido pelo ID.
 * @param {number} id - O ID do pedido.
 * @returns {object|null} O pedido removido ou null se não encontrado.
 */
async function removerPedido(id) {
    const client = await pool.connect();
    try {
        const query = `
            DELETE FROM pedidos
            WHERE id = $1
            RETURNING id, status, timestamp, data;
        `;
        const res = await client.query(query, [id]);
        
        if (res.rows.length === 0) {
            return null;
        }
        
        const row = res.rows[0];
        return {
            id: row.id,
            status: row.status,
            timestamp: row.timestamp,
            ...row.data
        };
    } finally {
        client.release();
    }
}

/**
 * Limpa todos os pedidos.
 */
async function limparTodosPedidos() {
    const client = await pool.connect();
    try {
        const query = `DELETE FROM pedidos;`;
        await client.query(query);
    } finally {
        client.release();
    }
}

/**
 * Verifica a conexão com o banco de dados.
 * @returns {boolean} True se a conexão for bem-sucedida.
 */
async function checkDbConnection() {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        return true;
    } catch (error) {
        console.error("Erro ao verificar conexão com o banco de dados:", error.message);
        return false;
    }
}

module.exports = {
    setupDatabase,
    salvarPedido,
    obterTodosPedidos,
    obterPedido,
    atualizarPedido,
    removerPedido,
    limparTodosPedidos,
    checkDbConnection
};
