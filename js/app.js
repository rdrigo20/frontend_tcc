const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const btnEnviar = document.getElementById('btn-enviar');

// IMPORTANTE: Ajuste a URL abaixo para o caminho exato do seu endpoint no MAMP
const URL_API_WP = 'http://localhost/seu-wordpress/wp-json/meu-chat/v1/enviar';

// Permite enviar apertando Enter
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') enviarMensagem();
});

btnEnviar.addEventListener('click', enviarMensagem);

async function enviarMensagem() {
    const texto = userInput.value.trim();
    if (!texto) return;

    // 1. Exibe a mensagem do usuário
    adicionarMensagemNaTela(texto, 'sent');
    userInput.value = '';

    // 2. Conecta com a API no WordPress
    try {
        const resposta = await fetch(URL_API_WP, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mensagem: texto })
        });

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const dados = await resposta.json();
        
        // 3. Exibe a resposta do Backend
        adicionarMensagemNaTela(dados.resposta, 'received');

    } catch (erro) {
        console.error("Erro no Fetch:", erro);
        adicionarMensagemNaTela("Ocorreu um erro ao comunicar com o servidor.", 'received');
    }
}

function adicionarMensagemNaTela(texto, tipo) {
    const div = document.createElement('div');
    div.classList.add('message', tipo);
    div.textContent = texto;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Rola pro final
}