document.addEventListener("DOMContentLoaded", () => {
    // Configuração da URL do backend - ajusta automaticamente para produção ou desenvolvimento
    const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? "http://localhost:3000"
        : window.location.origin; // Em produção, usa a mesma origem
    
    const comandasWrapper = document.getElementById("comandas-wrapper");
    const semPedidosMensagem = document.getElementById("sem-pedidos");
    const timestampAtualizacao = document.getElementById("timestamp-atualizacao");
    let swiperInstance = null;
    let ultimoPedidoId = null; // Para verificar se há novos pedidos
    let tentativasConexao = 0;
    const MAX_TENTATIVAS = 5;
    let intervaloBusca = 10000; // 10 segundos inicialmente
    let temporizadorBusca = null;

    // Função para sanitizar HTML (básica)
    function sanitizeHTML(str) {
        const temp = document.createElement("div");
        temp.textContent = str;
        return temp.innerHTML;
    }

    // Função para formatar a data
    function formatarData(isoString) {
        if (!isoString) return "Data indisponível";
        try {
            const data = new Date(isoString);
            return data.toLocaleString("pt-BR");
        } catch (e) {
            console.error("Erro ao formatar data:", e);
            return "Data inválida";
        }
    }

    // Função para formatar número de telefone para WhatsApp
    function formatarTelefoneParaWhatsApp(telefone) {
        // Remove todos os caracteres não numéricos
        return telefone.replace(/\D/g, '');
    }

    // Função para criar o HTML de uma comanda
    function criarComandaHTML(pedido) {
        // Extrai dados do novo formato JSON
        const displayId = sanitizeHTML(pedido.displayId || "N/A");
        const total = pedido.total ? pedido.total.toFixed(2) : "N/A";
        const timestamp = formatarData(pedido.timestamp);
        
        // Informações do Cliente (assumindo que estão em pedido.customer)
        const customer = pedido.customer || {};
        const nome = sanitizeHTML(customer.name || "N/A");
        const telefone = sanitizeHTML(customer.phone || "N/A");
        const endereco = sanitizeHTML(customer.address || "N/A");
        
        // Informações de Pagamento (assumindo que estão em pedido.payment)
        const payment = pedido.payment || {};
        const formaPagamento = sanitizeHTML(payment.method || "N/A");
        const trocoPara = payment.changeFor && payment.changeFor > pedido.total 
            ? ` (Troco para R$ ${payment.changeFor.toFixed(2)})` 
            : "";
        
        // Itens do Pedido
        const items = pedido.items || [];
        
        // Função auxiliar para renderizar os itens
        function renderizarItens(itens) {
            return itens.map(item => {
                const itemName = sanitizeHTML(item.name || "Item");
                const itemQty = item.quantity || 1;
                const itemNotes = sanitizeHTML(item.notes || "");
                
                // Renderiza sabores (Flavors)
                const flavors = item.flavors || [];
                const flavorsHtml = flavors.map(flavor => {
                    const flavorName = sanitizeHTML(flavor.name || "");
                    const flavorPortion = sanitizeHTML(flavor.portion || "inteira");
                    return `<li class="sabor-item">${flavorPortion} de ${flavorName}</li>`;
                }).join('');
                
                // Renderiza modificadores
                const modifiers = item.modifiers || [];
                const modifiersHtml = modifiers.map(mod => {
                    const modName = sanitizeHTML(mod.name || "");
                    const modGroup = sanitizeHTML(mod.groupName || "");
                    const modPrice = mod.price && mod.price > 0 ? ` (+R$ ${mod.price.toFixed(2)})` : "";
                    return `<li class="modificador">${modGroup}: ${modName}${modPrice}</li>`;
                }).join('');
                
                const notesHtml = itemNotes ? `<p class="item-observacao">Obs: ${itemNotes}</p>` : '';
                
                return `
                    <li class="item-pedido">
                        <span class="item-quantidade">${itemQty}x</span>
                        <span class="item-nome">${itemName}</span>
                        ${flavorsHtml ? `<ul class="lista-sabores">${flavorsHtml}</ul>` : ''}
                        ${notesHtml}
                        ${modifiersHtml ? `<ul class="lista-modificadores">${modifiersHtml}</ul>` : ''}
                    </li>
                `;
            }).join('');
        }
        
        // Observações gerais (se houver) - Não há um campo padrão no JSON de exemplo, mas podemos procurar em 'notes' ou 'observacoes'
        const observacoesGerais = sanitizeHTML(pedido.notes || pedido.observacoes || "");
        const temObservacoes = observacoesGerais.length > 0;
        
        // Adiciona classe de destaque para pedidos novos (menos de 2 minutos)
        const isNovo = (new Date() - new Date(pedido.timestamp)) < 120000;
        const classeNovo = isNovo ? 'comanda-nova' : '';
        
        // Prepara links para WhatsApp e Google Maps
        const telefoneWhatsApp = formatarTelefoneParaWhatsApp(telefone);
        const whatsappLink = `https://wa.me/${telefoneWhatsApp}`;
        const enderecoMaps = encodeURIComponent(endereco);
        const mapsLink = `https://www.google.com/maps/search/?api=1&query=${enderecoMaps}`;
        
        // Prepara botões de ação (finalizar, deletar e imprimir)
        const botoesAcao = `
            <div class="acoes-comanda">
                <button class="btn-finalizar" data-id="${pedido.id}" title="Marcar como finalizado">
                    <i class="fas fa-check-circle"></i> Finalizar
                </button>
                <button class="btn-imprimir" data-id="${pedido.id}" title="Imprimir Comanda">
                    <i class="fas fa-print"></i> Imprimir
                </button>
                <button class="btn-deletar" data-id="${pedido.id}" title="Deletar pedido">
                    <i class="fas fa-trash-alt"></i> Deletar
                </button>
            </div>
        `;

        return `
            <div class="swiper-slide">
                <div class="comanda ${classeNovo}">
                    <h2>Pedido #${pedido.id} - ID Externo: ${displayId}</h2>
                    
                    <div class="contato-cliente">
                        <p>
                            <strong>Cliente:</strong> ${nome}
                        </p>
                        <p>
                            <strong>Telefone:</strong> ${telefone}
                            <a href="${whatsappLink}" target="_blank" class="btn-whatsapp" title="Contatar via WhatsApp">
                                <i class="fab fa-whatsapp"></i>
                            </a>
                        </p>
                    </div>
                    
                    <div class="detalhes-pedido">
                        <h3>Itens do Pedido</h3>
                        <ul class="lista-itens">
                            ${renderizarItens(items)}
                        </ul>
                    </div>
                    
                    <div class="endereco-container">
                        <p class="endereco">
                            <strong>Endereço:</strong> ${endereco}
                            <a href="${mapsLink}" target="_blank" class="btn-maps" title="Ver no Google Maps">
                                <i class="fas fa-map-marker-alt"></i>
                            </a>
                        </p>
                    </div>
                    
                    <p class="pagamento">
                        <strong>Total:</strong> R$ ${total}
                        <br>
                        <strong>Pagamento:</strong> ${formaPagamento}${trocoPara}
                    </p>
                    
                    ${temObservacoes ? `<div class="observacoes"><strong>Observações Gerais:</strong> ${observacoesGerais}</div>` : ''}
                    
                    <p class="timestamp">Recebido em: ${timestamp}</p>
                    
                    ${botoesAcao}
                    
                    ${isNovo ? '<div class="novo-badge">NOVO</div>' : ''}
                </div>
            </div>
        `;
    }

    // Função para inicializar ou atualizar o Swiper
    function inicializarOuAtualizarSwiper() {
        if (swiperInstance) {
            swiperInstance.update(); // Atualiza o Swiper existente
            return;
        }
        
        // Inicializa um novo Swiper
        swiperInstance = new Swiper(".swiper-container", {
            slidesPerView: 1,
            spaceBetween: 30,
            loop: false, // Não faz sentido loop se os pedidos são dinâmicos
            autoplay: {
                delay: 5000, // 5 segundos entre slides
                disableOnInteraction: false, // Continua após interação do usuário
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
            },
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
            breakpoints: {
                // Quando a largura da janela for >= 768px
                768: {
                    slidesPerView: 2,
                    spaceBetween: 40
                },
                // Quando a largura da janela for >= 1024px
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 50
                }
            },
            on: {
                init: function() {
                    // Reproduz som ao inicializar (se houver novos pedidos)
                    if (document.querySelector('.comanda-nova')) {
                        reproduzirSomNotificacao();
                    }
                }
            }
        });
    }

    // Função para reproduzir som de notificação
    function reproduzirSomNotificacao() {
        try {
            const audio = new Audio('notification.mp3');
            audio.volume = 0.7; // 70% do volume
            audio.play().catch(e => console.log('Reprodução automática de áudio bloqueada pelo navegador'));
        } catch (error) {
            console.error('Erro ao reproduzir som:', error);
        }
    }

    // Função para verificar status do servidor
    async function verificarStatusServidor() {
        try {
            const response = await fetch(`${backendUrl}/status`, { 
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                cache: 'no-store'
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`Servidor online. ${data.pedidosAtivos} pedidos ativos.`);
                document.getElementById('status-servidor').textContent = 'Conectado';
                document.getElementById('status-servidor').className = 'status-online';
                return true;
            } else {
                throw new Error(`Status ${response.status}`);
            }
        } catch (error) {
            console.error('Erro ao verificar status do servidor:', error);
            document.getElementById('status-servidor').textContent = 'Desconectado';
            document.getElementById('status-servidor').className = 'status-offline';
            return false;
        }
    }

    // Função para finalizar um pedido
    async function finalizarPedido(id) {
        try {
            const apiKey = prompt("Digite a chave de API para finalizar o pedido:");
            if (!apiKey) return; // Usuário cancelou
            
            const response = await fetch(`${backendUrl}/pedido/${id}/finalizar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'x-api-key': apiKey
                }
            });
            
            if (!response.ok) {
                const erro = await response.json();
                throw new Error(`Erro ao finalizar pedido: ${JSON.stringify(erro)}`);
            }
            
            const resultado = await response.json();
            console.log("Pedido finalizado com sucesso:", resultado);
            alert("Pedido finalizado com sucesso!");
            
            // Força atualização imediata
            buscarERenderizarPedidos();
            
        } catch (error) {
            console.error("Erro ao finalizar pedido:", error);
            alert(`Erro ao finalizar pedido: ${error.message}`);
        }
    }
    
    // Função para imprimir um pedido
    async function imprimirPedido(id) {
        try {
            const response = await fetch(`${backendUrl}/pedido/${id}/imprimir`, {
                method: 'GET',
                headers: { 'Accept': 'text/plain' }
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao obter recibo: ${response.status}`);
            }
            
            const reciboTexto = await response.text();
            
            // Abre uma nova janela para impressão
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                <head>
                    <title>Comanda #${id}</title>
                    <style>
                        body { 
                            font-family: monospace; 
                            white-space: pre; 
                            font-size: 10px; 
                            margin: 0; 
                            padding: 10px;
                        }
                        @media print {
                            /* Oculta cabeçalhos e rodapés do navegador */
                            @page { margin: 0; }
                            body { margin: 0; }
                        }
                    </style>
                </head>
                <body>${reciboTexto}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            
        } catch (error) {
            console.error("Erro ao imprimir pedido:", error);
            alert(`Erro ao imprimir pedido: ${error.message}`);
        }
    }

    // Função para deletar um pedido
    async function deletarPedido(id) {
        try {
            if (!confirm(`Tem certeza que deseja deletar o pedido #${id}?`)) {
                return; // Usuário cancelou
            }
            
            const apiKey = prompt("Digite a chave de API para deletar o pedido:");
            if (!apiKey) return; // Usuário cancelou
            
            const response = await fetch(`${backendUrl}/pedido/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'x-api-key': apiKey
                }
            });
            
            if (!response.ok) {
                const erro = await response.json();
                throw new Error(`Erro ao deletar pedido: ${JSON.stringify(erro)}`);
            }
            
            const resultado = await response.json();
            console.log("Pedido deletado com sucesso:", resultado);
            alert("Pedido deletado com sucesso!");
            
            // Força atualização imediata
            buscarERenderizarPedidos();
            
        } catch (error) {
            console.error("Erro ao deletar pedido:", error);
            alert(`Erro ao deletar pedido: ${error.message}`);
        }
    }

    // Função para buscar e renderizar os pedidos
    async function buscarERenderizarPedidos() {
        try {
            // Verifica status do servidor primeiro
            const servidorOnline = await verificarStatusServidor();
            if (!servidorOnline) {
                tentativasConexao++;
                if (tentativasConexao >= MAX_TENTATIVAS) {
                    // Após várias tentativas, aumenta o intervalo para não sobrecarregar
                    intervaloBusca = 30000; // 30 segundos
                    console.log(`Aumentando intervalo de busca para ${intervaloBusca/1000} segundos após ${tentativasConexao} tentativas`);
                }
                
                semPedidosMensagem.textContent = `Servidor indisponível. Tentando reconectar... (${tentativasConexao}/${MAX_TENTATIVAS})`;
                semPedidosMensagem.style.display = "block";
                
                // Agenda próxima tentativa
                if (temporizadorBusca) clearTimeout(temporizadorBusca);
                temporizadorBusca = setTimeout(buscarERenderizarPedidos, intervaloBusca);
                return;
            }
            
            // Servidor está online, reseta contadores
            tentativasConexao = 0;
            intervaloBusca = 10000; // Volta ao intervalo normal
            
            const response = await fetch(`${backendUrl}/pedidos`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                cache: 'no-store'
            });
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const pedidos = await response.json();

            // Atualiza o timestamp da última atualização
            timestampAtualizacao.textContent = new Date().toLocaleTimeString("pt-BR");

            if (pedidos.length === 0) {
                comandasWrapper.innerHTML = ""; // Limpa comandas existentes
                semPedidosMensagem.style.display = "block";
                semPedidosMensagem.textContent = "Aguardando novos pedidos...";
                if (swiperInstance) {
                    swiperInstance.destroy(true, true); // Destroi o swiper se não há pedidos
                    swiperInstance = null;
                }
                ultimoPedidoId = null; // Reseta o último ID
                return;
            }

            // Verifica se há novos pedidos comparando o ID do mais recente
            const idMaisRecente = pedidos[0]?.id;
            const temNovosPedidos = idMaisRecente !== ultimoPedidoId && ultimoPedidoId !== null;
            
            if (idMaisRecente === ultimoPedidoId) {
                // Nenhum pedido novo, apenas atualiza o timestamp
                return;
            }
            
            // Armazena o ID mais recente para próxima comparação
            ultimoPedidoId = idMaisRecente;

            // Há novos pedidos ou é a primeira carga
            semPedidosMensagem.style.display = "none";
            comandasWrapper.innerHTML = ""; // Limpa antes de adicionar

            pedidos.forEach(pedido => {
                comandasWrapper.innerHTML += criarComandaHTML(pedido);
            });

            // Adiciona event listeners para os botões de ação
            document.querySelectorAll('.btn-finalizar').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    finalizarPedido(id);
                });
            });
            
            document.querySelectorAll('.btn-imprimir').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    imprimirPedido(id);
                });
            });
            
            document.querySelectorAll('.btn-deletar').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    deletarPedido(id);
                });
            });

            // Inicializa ou atualiza o Swiper DEPOIS que o HTML foi adicionado
            inicializarOuAtualizarSwiper();
            
            // Se há novos pedidos (não é a primeira carga), reproduz som
            if (temNovosPedidos) {
                reproduzirSomNotificacao();
                // Pisca o título da página
                piscarTituloPagina("🔔 NOVO PEDIDO! - Monitor de Comandas", "Monitor de Comandas");
            }

        } catch (error) {
            console.error("Erro ao buscar ou renderizar pedidos:", error);
            semPedidosMensagem.textContent = "Erro ao carregar pedidos. Verifique o backend.";
            semPedidosMensagem.style.display = "block";
            comandasWrapper.innerHTML = "";
            if (swiperInstance) {
                swiperInstance.destroy(true, true);
                swiperInstance = null;
            }
        } finally {
            // Agenda próxima busca
            if (temporizadorBusca) clearTimeout(temporizadorBusca);
            temporizadorBusca = setTimeout(buscarERenderizarPedidos, intervaloBusca);
        }
    }
    
    // Função para piscar o título da página quando chegar novo pedido
    let intervaloPiscar = null;
    let contadorPiscar = 0;
    
    function piscarTituloPagina(titulo1, titulo2) {
        if (intervaloPiscar) {
            clearInterval(intervaloPiscar);
            contadorPiscar = 0;
        }
        
        intervaloPiscar = setInterval(() => {
            document.title = document.title === titulo1 ? titulo2 : titulo1;
            contadorPiscar++;
            
            // Para de piscar após 10 alternâncias (5 ciclos)
            if (contadorPiscar >= 10) {
                clearInterval(intervaloPiscar);
                document.title = titulo2;
            }
        }, 1000); // Alterna a cada segundo
    }
    
    // Função para testar o som de notificação
    window.testarSom = function() {
        reproduzirSomNotificacao();
    };
    
    // Função para simular um pedido de teste
    window.enviarPedidoTeste = async function() {
        try {
            // Novo formato JSON robusto para o pedido de teste
            const pedidoTeste = {
                "displayId": "TESTE-999",
                "sourcePlatform": "MONITOR_TEST",
                "total": 65.50,
                "items": [
                    {
                        "name": "Pizza Grande - Margherita",
                        "quantity": 1,
                        "unitPrice": 50.00,
                        "totalPrice": 50.00,
                        "notes": "Borda recheada com Catupiry",
                        "modifiers": [
                            {
                                "groupName": "Tamanho",
                                "name": "Grande",
                                "quantity": 1,
                                "price": 0
                            }
                        ]
                    },
                    {
                        "name": "Coca-Cola 2L",
                        "quantity": 1,
                        "unitPrice": 15.50,
                        "totalPrice": 15.50,
                        "notes": "",
                        "modifiers": []
                    }
                ],
                "customer": {
                    "name": "Cliente Teste",
                    "phone": "5511987654321",
                    "address": "Rua de Teste, 123 - Bairro Teste"
                },
                "payment": {
                    "method": "PIX",
                    "changeFor": 0
                },
                "notes": "Entregar na portaria, apto 101."
            };
            
            const response = await fetch(`${backendUrl}/pedido`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(pedidoTeste)
            });
            
            if (!response.ok) {
                const erro = await response.json();
                throw new Error(`Erro ao enviar pedido: ${JSON.stringify(erro)}`);
            }
            
            const resultado = await response.json();
            console.log("Pedido de teste enviado com sucesso:", resultado);
            alert("Pedido de teste enviado com sucesso!");
            
            // Força atualização imediata
            buscarERenderizarPedidos();
            
        } catch (error) {
            console.error("Erro ao enviar pedido de teste:", error);
            alert(`Erro ao enviar pedido de teste: ${error.message}`);
        }
    };

    // Adiciona manipuladores de eventos para visibilidade da página
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // Página voltou a ficar visível, atualiza imediatamente
            buscarERenderizarPedidos();
            // Reseta o título se estiver piscando
            if (intervaloPiscar) {
                clearInterval(intervaloPiscar);
                document.title = "Monitor de Comandas";
            }
        }
    });

    // Busca inicial
    buscarERenderizarPedidos();
    
    // Adiciona botões de controle à interface
    const controles = document.createElement('div');
    controles.className = 'controles-admin';
    controles.innerHTML = `
        <div class="status-container">
            <span>Status: <span id="status-servidor">Verificando...</span></span>
        </div>
        <button onclick="testarSom()" class="btn-controle">Testar Som</button>
        <button onclick="enviarPedidoTeste()" class="btn-controle">Enviar Pedido Teste</button>
    `;
    document.querySelector('footer').appendChild(controles);
});
