document.addEventListener('DOMContentLoaded', () => {
    
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const btnEnviar = document.getElementById('btn-enviar');

    let perguntas = []; 
    let indiceAtual = 0; 
    let idConversaReal = null; 

    const BASE_URL = 'http://localhost/arquivos_wordpress/wp-json/api';

    // 1. INICIAR CONVERSA
    async function iniciarNovaConversa() {
        try {
            const dataHoje = new Date().toLocaleDateString('pt-BR');
            const payloadConversa = {
                user_id: userId,
                titulo: `Configuração de Rede - ${dataHoje}`,
                conteudo: "Conversa gerada pelo assistente automático."
            };

            const response = await fetch(`${BASE_URL}/conversa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadConversa)
            });

            if (!response.ok) throw new Error('Falha ao criar conversa');

            const data = await response.json();
            idConversaReal = data.conversa_id; 

            carregarPerguntas();

        } catch (error) {
            console.error("Erro ao iniciar conversa:", error);
            adicionarMensagemNaTela('Erro ao iniciar a sessão com o servidor.', 'bot');
        }
    }

    // 2. BUSCAR PERGUNTAS E CORRIGIR A ORDENAÇÃO/FILTRO
    async function carregarPerguntas() {
        try {
            const response = await fetch(`${BASE_URL}/pergunta`);
            const data = await response.json();

            // Corrige o bug do filtro: converte para string minúscula para pegar "1" ou "true" com segurança
            let perguntasFiltradas = data.filter(p => {
                const mostrar = String(p.meta.mostrar).toLowerCase();
                return mostrar === '1' || mostrar === 'true';
            });

            // Corrige o bug de ordem: previne NaN usando o fallback (|| 0)
            perguntas = perguntasFiltradas.sort((a, b) => {
                const ordemA = parseInt(a.meta.ordem) || 0;
                const ordemB = parseInt(b.meta.ordem) || 0;
                return ordemA - ordemB;
            });

            chatMessages.innerHTML = ''; 
            
            if (perguntas.length > 0) {
                liberarInput();
                fazerPerguntaAtual();
            } else {
                adicionarMensagemNaTela('Nenhuma pergunta configurada no sistema.', 'bot');
            }

        } catch (error) {
            adicionarMensagemNaTela('Erro ao conectar com o banco de dados de perguntas.', 'bot');
        }
    }

    // 3. EXIBIR A PERGUNTA
    function fazerPerguntaAtual() {
        const pergunta = perguntas[indiceAtual];
        const textoPergunta = pergunta.content ? pergunta.content : pergunta.title;
        adicionarMensagemNaTela(textoPergunta, 'bot');
    }

    // 4. EVENTOS DE ENVIO
    btnEnviar.addEventListener('click', enviarResposta);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarResposta();
    });

    // 5. ENVIAR A RESPOSTA (SEM ATRASOS)
    async function enviarResposta() {
        const textoResposta = userInput.value.trim();
        if (!textoResposta) return;

        adicionarMensagemNaTela(textoResposta, 'user');
        userInput.value = '';
        bloquearInput();

        const perguntaAtual = perguntas[indiceAtual];

        const payload = {
            user_id: userId,
            pergunta_id: perguntaAtual.id,
            conteudo: textoResposta,
            id_conversa: idConversaReal 
        };

        try {
            const response = await fetch(`${BASE_URL}/resposta`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Erro ao salvar no banco');

            indiceAtual++;

            // Execução instantânea: O setTimeout de 800ms foi removido
            if (indiceAtual < perguntas.length) {
                fazerPerguntaAtual();
                liberarInput();
            } else {
                finalizarChat();
            }

        } catch (error) {
            adicionarMensagemNaTela('Erro ao salvar resposta. Tente reenviar.', 'bot');
            liberarInput(); 
        }
    }

    // 6. FINALIZAR SESSÃO
    function finalizarChat() {
        adicionarMensagemNaTela('Configuração finalizada! Todas as suas respostas foram atreladas a esta sessão.', 'bot');
        bloquearInput();
        
        // Mantém apenas o tempo para ler a última mensagem antes de voltar ao painel
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 3000);
    }

    // --- FUNÇÕES VISUAIS ---

    function adicionarMensagemNaTela(texto, remetente) {
        const divBox = document.createElement('div');
        divBox.className = 'flex w-full ' + (remetente === 'user' ? 'justify-end' : 'justify-start');

        const divMsg = document.createElement('div');
        divMsg.className = 'px-4 py-2 max-w-[80%] text-sm ';
        
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

    iniciarNovaConversa();
});