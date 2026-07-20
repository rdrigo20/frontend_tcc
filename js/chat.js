document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Verificação de Segurança e ID do Usuário
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    // Elementos da tela
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const btnEnviar = document.getElementById('btn-enviar');

    // Variáveis de controle
    let perguntas = []; 
    let indiceAtual = 0; 
    
    // GERA O ID DA CONVERSA (Ex: 1689304958392)
    // Todas as respostas desta sessão terão esse mesmo ID_Conversa
    const idConversaSessao = Date.now().toString(); 

    // OBRIGATÓRIO: Coloque o caminho exato da sua pasta do WordPress aqui
    const BASE_URL = 'http://localhost/arquivos_wordpress/wp-json/api';

    // 2. BUSCAR AS PERGUNTAS NA API
    async function carregarPerguntas() {
        try {
            const response = await fetch(`${BASE_URL}/pergunta`);
            
            if (!response.ok) throw new Error('Falha ao carregar perguntas');
            
            const data = await response.json();

            // Filtra apenas as perguntas que estão marcadas para "mostrar" (pode vir como booleano ou string '1')
            let perguntasFiltradas = data.filter(p => p.meta.mostrar === true || p.meta.mostrar === '1');

            // Ordena as perguntas baseando-se no campo 'ordem'
            perguntas = perguntasFiltradas.sort((a, b) => parseInt(a.meta.ordem) - parseInt(b.meta.ordem));

            chatMessages.innerHTML = ''; // Limpa o aviso de "Conectando..."
            
            if (perguntas.length > 0) {
                liberarInput();
                fazerPerguntaAtual();
            } else {
                adicionarMensagemNaTela('Nenhuma pergunta configurada no sistema.', 'bot');
            }

        } catch (error) {
            console.error(error);
            chatMessages.innerHTML = '';
            adicionarMensagemNaTela('Erro ao conectar com o servidor.', 'bot');
        }
    }

    // 3. EXIBIR A PERGUNTA
    function fazerPerguntaAtual() {
        const pergunta = perguntas[indiceAtual];
        // Mostra o conteúdo da pergunta (ou o título, caso o conteúdo esteja vazio)
        const textoPergunta = pergunta.content ? pergunta.content : pergunta.title;
        adicionarMensagemNaTela(textoPergunta, 'bot');
    }

    // 4. EVENTOS DE CLIQUE E ENTER
    btnEnviar.addEventListener('click', enviarResposta);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarResposta();
    });

    // 5. ENVIAR A RESPOSTA PARA A API
    async function enviarResposta() {
        const textoResposta = userInput.value.trim();
        if (!textoResposta) return;

        // Bota a mensagem na tela e bloqueia o input
        adicionarMensagemNaTela(textoResposta, 'user');
        userInput.value = '';
        bloquearInput();

        const perguntaAtual = perguntas[indiceAtual];

        // Cria o pacote JSON exatamente como o seu PHP 'resposta_create' espera
        const payload = {
            user_id: userId,
            pergunta_id: perguntaAtual.id,
            conteudo: textoResposta,
            id_conversa: idConversaSessao // Agrupador da conversa!
        };

        try {
            const response = await fetch(`${BASE_URL}/resposta`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Erro ao salvar no banco');

            // Deu certo! Avança o índice
            indiceAtual++;

            // Efeito de digitação para a próxima pergunta (espera 800ms)
            setTimeout(() => {
                if (indiceAtual < perguntas.length) {
                    fazerPerguntaAtual();
                    liberarInput();
                } else {
                    finalizarChat();
                }
            }, 800);

        } catch (error) {
            console.error(error);
            adicionarMensagemNaTela('Ops! Ocorreu um erro ao salvar sua resposta. Tente reenviar.', 'bot');
            liberarInput(); // Libera para ele tentar de novo
        }
    }

    // 6. FINALIZAR A SESSÃO
    function finalizarChat() {
        adicionarMensagemNaTela('Configuração finalizada! Todas as suas respostas foram salvas.', 'bot');
        bloquearInput();
        
        // Redireciona de volta para o Dashboard após 3 segundos
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 3000);
    }

    // --- FUNÇÕES VISUAIS (Desenham os balões no HTML) ---

    function adicionarMensagemNaTela(texto, remetente) {
        const divBox = document.createElement('div');
        divBox.className = 'flex w-full ' + (remetente === 'user' ? 'justify-end' : 'justify-start');

        const divMsg = document.createElement('div');
        divMsg.className = 'px-4 py-2 max-w-[80%] text-sm ';
        
        if (remetente === 'user') {
            divMsg.className += 'bg-blue-500 text-white rounded-bl-lg rounded-tl-lg rounded-tr-lg';
            divMsg.textContent = texto; // Proteção XSS para o que o usuário digita
        } else {
            // Mensagens do bot (WordPress) podem vir com tags <p> do editor
            divMsg.className += 'bg-white border border-gray-200 text-gray-800 rounded-br-lg rounded-tr-lg rounded-tl-lg shadow-sm';
            divMsg.innerHTML = texto; 
        }

        divBox.appendChild(divMsg);
        chatMessages.appendChild(divBox);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Rola pra baixo
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

    // Inicia tudo
    carregarPerguntas();
});