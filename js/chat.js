document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Verificação de Autenticação
    const userId = localStorage.getItem('user_id');
    const userNome = localStorage.getItem('user_nome');
    
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    // Elementos da Interface
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const btnEnviar = document.getElementById('btn-enviar');

    // Variável crucial que guardará a memória do chat
    let idConversaReal = null; 

    // Ajuste para a URL do seu ambiente MAMP
    const BASE_URL = 'http://localhost/arquivos_wordpress/wp-json/api';

    // 2. INICIA A SESSÃO NO BANCO DE DADOS
    async function iniciarNovaConversa() {
        try {
            const dataHoje = new Date().toLocaleDateString('pt-BR');
            const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            const payloadConversa = {
                user_id: userId,
                titulo: `Configuração com IA - ${dataHoje} às ${hora}`,
                conteudo: "Sessão de configuração de rede assistida por Inteligência Artificial."
            };

            const response = await fetch(`${BASE_URL}/conversa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadConversa)
            });

            if (!response.ok) throw new Error('Falha ao criar conversa');

            const data = await response.json();
            
            // Guarda o ID real da conversa para enviar junto com as mensagens
            idConversaReal = data.conversa_id; 

            // Limpa o "Conectando..." e dá as boas-vindas
            chatMessages.innerHTML = '';
            adicionarMensagemNaTela(`Olá, ${userNome}! Sou o seu assistente de rede avançado. O que você gostaria de configurar no seu Firewall hoje?`, 'bot');
            liberarInput();

        } catch (error) {
            console.error("Erro ao iniciar conversa:", error);
            adicionarMensagemNaTela('Erro ao iniciar a sessão com o servidor. Verifique se o backend está rodando.', 'bot');
        }
    }

    // 3. EVENTOS DE ENVIO (Clique e Enter)
    btnEnviar.addEventListener('click', enviarMensagem);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensagem();
    });

    // 4. A COMUNICAÇÃO COM A IA
    async function enviarMensagem() {
        const textoResposta = userInput.value.trim();
        if (!textoResposta) return;

        // Joga a mensagem do usuário na tela e limpa o campo
        adicionarMensagemNaTela(textoResposta, 'user');
        userInput.value = '';
        bloquearInput();

        // Adiciona um balão temporário de "Pensando..." 
        const idBalaoPensando = adicionarMensagemDeCarregamento();

        const payload = {
            id_conversa: idConversaReal,
            mensagem: textoResposta
        };

        try {
            const response = await fetch(`${BASE_URL}/chat-ia`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            // Remove o balão de "Pensando..."
            removerElemento(idBalaoPensando);

            if (!response.ok || data.status !== 'sucesso') {
                throw new Error(data.mensagem || 'Erro na comunicação com a IA');
            }

            // ==========================================
            // NOVO: SISTEMA CAÇA-RESPOSTAS (RESILIÊNCIA)
            // ==========================================
            console.log("JSON recebido do Ollama:", data.dados); // <- DEBUG: Aparece no F12 do navegador

            let respostaDaIA = "Configuração atualizada! (A IA não enviou uma fala).";

            if (data.dados) {
                // Caso 1: A IA fez certinho (fora da configuração)
                if (data.dados.resposta_amigavel) {
                    respostaDaIA = data.dados.resposta_amigavel;
                } 
                // Caso 2: A IA errou e jogou a resposta dentro da configuração
                else if (data.dados.configuracao && data.dados.configuracao.resposta_amigavel) {
                    respostaDaIA = data.dados.configuracao.resposta_amigavel;
                }
                // Caso 3: A IA retornou APENAS texto e quebrou o JSON (muito raro)
                else if (typeof data.dados === 'string') {
                    respostaDaIA = data.dados;
                }
            }

            // Exibe a resposta final encontrada
            adicionarMensagemNaTela(respostaDaIA, 'bot');

        } catch (error) {
            console.error("Erro no chat:", error);
            removerElemento(idBalaoPensando);
            adicionarMensagemNaTela('Desculpe, ocorreu um erro de conexão ou demora excessiva. Tente enviar novamente.', 'bot');
        } finally {
            liberarInput();
        }
    }

    // --- FUNÇÕES AUXILIARES VISUAIS ---

    function adicionarMensagemNaTela(texto, remetente) {
        const divBox = document.createElement('div');
        divBox.className = 'flex w-full ' + (remetente === 'user' ? 'justify-end' : 'justify-start');

        const divMsg = document.createElement('div');
        divMsg.className = 'px-4 py-2 max-w-[80%] text-sm ';
        
        if (remetente === 'user') {
            divMsg.className += 'bg-blue-500 text-white rounded-bl-lg rounded-tl-lg rounded-tr-lg';
            divMsg.textContent = texto; // Proteção contra injeção de HTML
        } else {
            divMsg.className += 'bg-white border border-gray-200 text-gray-800 rounded-br-lg rounded-tr-lg rounded-tl-lg shadow-sm';
            divMsg.innerHTML = texto; 
        }

        divBox.appendChild(divMsg);
        chatMessages.appendChild(divBox);
        chatMessages.scrollTop = chatMessages.scrollHeight; 
    }

    // Função para mostrar que a IA está gerando a resposta
    function adicionarMensagemDeCarregamento() {
        const idTemporario = 'msg-loading-' + Date.now();
        
        const divBox = document.createElement('div');
        divBox.id = idTemporario;
        divBox.className = 'flex w-full justify-start';
        
        const divMsg = document.createElement('div');
        divMsg.className = 'px-4 py-2 max-w-[80%] text-sm bg-gray-100 border border-gray-200 text-gray-500 rounded-br-lg rounded-tr-lg rounded-tl-lg italic shadow-sm';
        divMsg.innerHTML = '<span class="animate-pulse">A IA está analisando sua rede...</span>';
        
        divBox.appendChild(divMsg);
        chatMessages.appendChild(divBox);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return idTemporario;
    }

    function removerElemento(id) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.remove();
    }

    function bloquearInput() {
        userInput.disabled = true;
        btnEnviar.disabled = true;
        userInput.placeholder = "Aguarde a resposta...";
    }

    function liberarInput() {
        userInput.disabled = false;
        btnEnviar.disabled = false;
        userInput.placeholder = "Digite sua resposta...";
        userInput.focus();
    }

    // A MÁGICA COMEÇA AQUI: Inicia a conversa
    iniciarNovaConversa();
});