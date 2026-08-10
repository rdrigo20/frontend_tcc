document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Verificação de Segurança (Mantém o usuário logado)
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    // Elementos da interface
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const btnEnviar = document.getElementById('btn-enviar');

    let idConversaReal = null; 
    const BASE_URL = 'http://localhost/arquivos_wordpress/wp-json/api';

    // 2. Cria a sessão da conversa no banco (Crucial para o Histórico no Dashboard)
    async function iniciarNovaConversa() {
        try {
            const dataHoje = new Date().toLocaleDateString('pt-BR');
            const payload = {
                user_id: userId,
                titulo: `Assistente de Rede (IA) - ${dataHoje}`,
                conteudo: "Início da configuração via Ollama."
            };

            const response = await fetch(`${BASE_URL}/conversa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Erro ao criar conversa no banco.');
            const data = await response.json();
            
            idConversaReal = data.conversa_id; 

            // Limpa o "Conectando..." e dá as boas-vindas
            chatMessages.innerHTML = '';
            adicionarMensagemNaTela('Olá! Sou seu assistente de redes inteligente. O que você gostaria de configurar no IPTables hoje? (Ex: Bloquear um IP, liberar uma porta...)', 'bot');
            liberarInput();

        } catch (error) {
            console.error(error);
            adicionarMensagemNaTela('Erro ao iniciar a sessão com o servidor.', 'bot');
        }
    }

    // 3. EVENTOS DE CLIQUE E ENTER
    btnEnviar.addEventListener('click', enviarMensagem);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensagem();
    });

    // 4. A FUNÇÃO PRINCIPAL QUE FALA COM A SUA API (E A IA)
    async function enviarMensagem() {
        const texto = userInput.value.trim();
        if (!texto) return;

        // Bota a mensagem do usuário na tela e bloqueia digitação
        adicionarMensagemNaTela(texto, 'user');
        userInput.value = '';
        bloquearInput(); 
        
        // Coloca um balão temporário indicando que a IA está pensando...
        const idBalaoPensando = adicionarMensagemNaTela('Analisando...', 'bot', true);

        try {
            // Faz a chamada para o seu backend WordPress
            const response = await fetch(`${BASE_URL}/chat-ia`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    mensagem: texto,
                    user_id: userId,
                    id_conversa: idConversaReal // Mandamos isso para o WP salvar no histórico dps!
                })
            });

            const data = await response.json();

            // Remove o balão de "Analisando..."
            removerMensagem(idBalaoPensando);

            if (!response.ok) throw new Error('Erro na API');

            // Acessa a fala amigável que a IA gerou e desenha na tela
            const respostaDaIA = data.dados.resposta_amigavel;
            adicionarMensagemNaTela(respostaDaIA, 'bot');
            
            // Console log para você ver o JSON puro sendo extraído nos bastidores
            console.log("JSON extraído pelo Ollama:", data.dados);

        } catch (error) {
            console.error(error);
            removerMensagem(idBalaoPensando);
            adicionarMensagemNaTela('Desculpe, a IA está indisponível ou demorou muito para responder.', 'bot');
        } finally {
            liberarInput();
        }
    }

    // --- FUNÇÕES VISUAIS ---

    function adicionarMensagemNaTela(texto, remetente, isTemp = false) {
        const divBox = document.createElement('div');
        const uniqueId = 'msg-' + Date.now();
        divBox.id = uniqueId;
        divBox.className = 'flex w-full ' + (remetente === 'user' ? 'justify-end' : 'justify-start');

        const divMsg = document.createElement('div');
        divMsg.className = 'px-4 py-2 max-w-[80%] text-sm ';
        
        if (isTemp) divMsg.className += 'italic opacity-70 '; // Estilo para o "pensando..."

        if (remetente === 'user') {
            divMsg.className += 'bg-blue-500 text-white rounded-bl-lg rounded-tl-lg rounded-tr-lg';
            divMsg.textContent = texto; 
        } else {
            divMsg.className += 'bg-white border border-gray-200 text-gray-800 rounded-br-lg rounded-tr-lg rounded-tl-lg shadow-sm';
            divMsg.innerHTML = texto; 
        }

        divBox.appendChild(divMsg);
        chatMessages.appendChild(divBox);
        chatMessages.scrollTop = chatMessages.scrollHeight; 
        
        return uniqueId;
    }

    function removerMensagem(id) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.remove();
    }

    function bloquearInput() {
        userInput.disabled = true;
        btnEnviar.disabled = true;
    }

    function liberarInput() {
        userInput.disabled = false;
        btnEnviar.disabled = false;
        userInput.focus();
    }

    // Dá o pontapé inicial
    iniciarNovaConversa();
});