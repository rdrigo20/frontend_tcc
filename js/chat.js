document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. VERIFICAÇÃO DE AUTENTICAÇÃO
    // ==========================================
    const userId = localStorage.getItem('user_id');
    const userNome = localStorage.getItem('user_nome');
    
    if (!userId) {
        window.location.href = 'login.html'; // Chuta para fora se não logou
        return;
    }

    // ==========================================
    // 2. CAPTURA DOS ELEMENTOS DA INTERFACE (HTML)
    // ==========================================
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const btnEnviar = document.getElementById('btn-enviar');
    const jsonViewer = document.getElementById('json-viewer'); // <--- NOVO: Captura a tela preta do JSON

    // Variável crucial que guardará a memória do chat (ID no banco)
    let idConversaReal = null; 

    // Ajuste para a URL do seu ambiente MAMP local
    const BASE_URL = 'http://localhost/arquivos_wordpress/wp-json/api';

    // ==========================================
    // 3. INICIALIZAÇÃO DA CONVERSA
    // ==========================================
    async function iniciarNovaConversa() {
        try {
            // Pega data e hora atual para dar um título único à conversa
            const dataHoje = new Date().toLocaleDateString('pt-BR');
            const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            const payloadConversa = {
                user_id: userId,
                titulo: `Configuração com IA - ${dataHoje} às ${hora}`,
                conteudo: "Sessão de configuração de rede assistida por Inteligência Artificial."
            };

            // Faz o POST para criar a conversa no backend (que salva o JSON padrão vazio)
            const response = await fetch(`${BASE_URL}/conversa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadConversa)
            });

            if (!response.ok) throw new Error('Falha ao criar conversa');

            const data = await response.json();
            
            // Guarda o ID que o WordPress gerou para mantermos a memória nas próximas requisições
            idConversaReal = data.conversa_id; 

            // Limpa o aviso de "Conectando..." do HTML
            chatMessages.innerHTML = '';
            
            // O Bot dá as boas-vindas usando o nome da pessoa
            adicionarMensagemNaTela(`Olá, ${userNome}! Sou o seu assistente de rede avançado. O que você gostaria de configurar no seu Firewall IPTables hoje?`, 'bot');
            
            // NOVO: Renderiza na tela o JSON padrão (aquele que criamos lá no PHP)
            // Isso mostra ao usuário o estado inicial ("vazio") da rede
            const configPadraoInicial = {
                "interfaces": { "wan": null, "lan": null },
                "lan_network": null,
                "policies": { "input": "ACCEPT", "forward": "ACCEPT", "output": "ACCEPT" },
                "nat": false,
                "lan_free_internet": false,
                "connection_states": [],
                "drop_invalid": false,
                "services": [],
                "blocked_ips": []
            };
            atualizarPainelJSON(configPadraoInicial);

            // Libera a barra para o usuário digitar
            liberarInput();

        } catch (error) {
            console.error("Erro ao iniciar conversa:", error);
            adicionarMensagemNaTela('Erro ao iniciar a sessão com o servidor. Verifique se o backend está rodando.', 'bot');
        }
    }

    // ==========================================
    // 4. EVENTOS DE CLIQUE E TECLADO (ENTER)
    // ==========================================
    btnEnviar.addEventListener('click', enviarMensagem);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensagem();
    });

    // ==========================================
    // 5. O NÚCLEO: ENVIO DE MENSAGEM PARA A IA
    // ==========================================
    async function enviarMensagem() {
        const textoResposta = userInput.value.trim();
        if (!textoResposta) return;

        // Imprime o que o usuário digitou na tela azul e limpa o input
        adicionarMensagemNaTela(textoResposta, 'user');
        userInput.value = '';
        bloquearInput(); // Trava a digitação enquanto a IA "pensa"

        // Adiciona um balão piscando indicando carregamento
        const idBalaoPensando = adicionarMensagemDeCarregamento();

        // Pacote de dados que será enviado ao PHP
        const payload = {
            id_conversa: idConversaReal,
            mensagem: textoResposta
        };

        try {
            // Chama a sua API que se conecta via túnel SSH com o Ollama
            const response = await fetch(`${BASE_URL}/chat-ia`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            // A resposta chegou! Pode remover a mensagem piscando
            removerElemento(idBalaoPensando);

            // Tratamento de erros do servidor
            if (!response.ok || data.status !== 'sucesso') {
                throw new Error(data.mensagem || 'Erro na comunicação com a IA');
            }

            console.log("JSON bruto recebido:", data.dados); // Para debug no F12

            // Variáveis para guardar o que extrairmos da IA
            let respostaDaIA = "Configuração atualizada! (A IA não enviou uma fala explicativa).";
            let configuracaoDaIA = null;

            // SISTEMA CAÇA-DADOS: Procura onde a IA colocou a fala e a configuração
            if (data.dados) {
                // Tenta achar a fala humana
                if (data.dados.resposta_amigavel) {
                    respostaDaIA = data.dados.resposta_amigavel;
                } else if (data.dados.configuracao && data.dados.configuracao.resposta_amigavel) {
                    respostaDaIA = data.dados.configuracao.resposta_amigavel; // Se a IA errou e colocou dentro
                }

                // Tenta achar o objeto de rede para atualizar na tela
                if (data.dados.configuracao) {
                    configuracaoDaIA = data.dados.configuracao;
                }
            }

            // AÇÃO 1: Mostra a fala do bot no balãozinho do chat
            adicionarMensagemNaTela(respostaDaIA, 'bot');

            // AÇÃO 2 (NOVO): Atualiza a tela preta lateral com o novo JSON gerado
            if (configuracaoDaIA) {
                atualizarPainelJSON(configuracaoDaIA);
            }

        } catch (error) {
            console.error("Erro no chat:", error);
            removerElemento(idBalaoPensando);
            adicionarMensagemNaTela('Desculpe, ocorreu um erro de conexão ou demora excessiva. Tente enviar novamente.', 'bot');
        } finally {
            // Independente de dar erro ou sucesso, libera o campo para ele tentar de novo
            liberarInput();
        }
    }


    // ==========================================
    // 6. FUNÇÕES AUXILIARES VISUAIS E DE UI
    // ==========================================

    /**
     * Pega um Objeto Javascript, converte para texto JSON com 2 espaços de margem
     * e injeta direto na tag <code> da tela preta.
     */
    function atualizarPainelJSON(objetoConfiguracao) {
        // O "null, 2" no stringify é o segredo para deixar o JSON indentado bonitinho
        const jsonFormatado = JSON.stringify(objetoConfiguracao, null, 2);
        jsonViewer.textContent = jsonFormatado;
    }

    function adicionarMensagemNaTela(texto, remetente) {
        const divBox = document.createElement('div');
        divBox.className = 'flex w-full ' + (remetente === 'user' ? 'justify-end' : 'justify-start');

        const divMsg = document.createElement('div');
        divMsg.className = 'px-4 py-2 max-w-[80%] text-sm ';
        
        if (remetente === 'user') {
            divMsg.className += 'bg-blue-600 text-white rounded-bl-lg rounded-tl-lg rounded-tr-lg shadow-sm';
            divMsg.textContent = texto; // Protege contra injeção de HTML acidental do usuário
        } else {
            divMsg.className += 'bg-white border border-gray-200 text-gray-800 rounded-br-lg rounded-tr-lg rounded-tl-lg shadow-sm';
            // Usa innerHTML para permitir que o bot quebre linhas caso necessário
            divMsg.innerHTML = texto.replace(/\n/g, '<br>'); 
        }

        divBox.appendChild(divMsg);
        chatMessages.appendChild(divBox);
        
        // Rola automaticamente para o fim do chat
        chatMessages.scrollTop = chatMessages.scrollHeight; 
    }

    function adicionarMensagemDeCarregamento() {
        const idTemporario = 'msg-loading-' + Date.now();
        
        const divBox = document.createElement('div');
        divBox.id = idTemporario;
        divBox.className = 'flex w-full justify-start';
        
        const divMsg = document.createElement('div');
        divMsg.className = 'px-4 py-2 max-w-[80%] text-sm bg-gray-100 border border-gray-200 text-gray-500 rounded-br-lg rounded-tr-lg rounded-tl-lg italic shadow-sm';
        divMsg.innerHTML = '<span class="animate-pulse">Analisando a estrutura da rede...</span>';
        
        divBox.appendChild(divMsg);
        chatMessages.appendChild(divBox);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return idTemporario; // Retornamos o ID para poder apagá-lo depois
    }

    function removerElemento(id) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.remove();
    }

    function bloquearInput() {
        userInput.disabled = true;
        btnEnviar.disabled = true;
        userInput.placeholder = "Aguarde a resposta do assistente...";
        btnEnviar.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
    }

    function liberarInput() {
        userInput.disabled = false;
        btnEnviar.disabled = false;
        userInput.placeholder = "Descreva a configuração desejada...";
        btnEnviar.innerHTML = 'Enviar';
        userInput.focus();
    }

    // ==========================================
    // INICIA O SISTEMA ASSIM QUE O ARQUIVO CARREGA
    // ==========================================
    iniciarNovaConversa();
});