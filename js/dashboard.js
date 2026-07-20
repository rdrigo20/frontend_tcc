document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Verifica quem está logado
    const userId = localStorage.getItem('user_id');
    const userNome = localStorage.getItem('user_nome');

    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Dá boas-vindas
    const saudacao = document.querySelector('header span');
    if (saudacao) {
        saudacao.textContent = `Olá, ${userNome}!`;
    }

    const historyList = document.getElementById('history-list');
    
    // ATENÇÃO AQUI: URL exata do seu WordPress com o ID do usuário no final
    const API_URL = `http://localhost/arquivos_wordpress/wp-json/api/conversa/usuario/${userId}`;

    try {
        console.log("1. Tentando buscar o histórico na URL:", API_URL);
        
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log("2. Status da resposta HTTP:", response.status);

        if (!response.ok) {
            throw new Error(`O servidor retornou um erro ${response.status}`);
        }

        const historico = await response.json();
        console.log("3. Dados que o PHP devolveu:", historico);

        historyList.innerHTML = ''; // Limpa a mensagem de "Carregando..."

        // Verifica se o PHP devolveu um erro formatado ou se o array está vazio
        if (historico.code || !Array.isArray(historico) || historico.length === 0) {
            historyList.innerHTML = '<p class="text-gray-500 italic">Você ainda não tem nenhuma configuração salva.</p>';
            return;
        }

        // Desenha os itens na tela
        historico.forEach(item => {
            const div = document.createElement('div');
            div.className = 'bg-white p-4 border border-gray-200 rounded-lg flex justify-between items-center shadow-sm hover:shadow transition-shadow mb-3';
            div.innerHTML = `
                <div class="text-gray-800">
                    <span class="font-semibold text-gray-600">Título:</span> ${item.titulo}
                </div>
                <div class="text-sm text-gray-500">
                    <span>Criado em: ${item.data}</span>
                </div>
            `;
            historyList.appendChild(div);
        });

    } catch (error) {
        console.error("ERRO FATAL NO DASHBOARD:", error);
        historyList.innerHTML = `<p class="text-red-500 font-medium">Falha ao carregar histórico: ${error.message}</p>`;
    }

    // 3. Botão de Sair
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_nome');
            window.location.href = 'login.html';
        });
    }
});