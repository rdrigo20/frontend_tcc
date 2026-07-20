

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('user_id');
    const userNome = localStorage.getItem('user_nome');

    // Se não tem ID, manda pro login
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    // Saudações
    document.querySelector('header span').textContent = `Olá, ${userNome}!`;

    const historyList = document.getElementById('history-list');
    
    try {
        // BUSCANDO DO BANCO DE DADOS DE VERDADE!
        // Coloque a URL do seu MAMP e anexe o ID do usuário no final da rota
        const response = await fetch(`http://localhost/seu-wp/wp-json/api/conversa/usuario/${userId}`);
        const historico = await response.json();

        historyList.innerHTML = ''; // Limpa o "Carregando..."

        if (historico.length === 0) {
            historyList.innerHTML = '<p class="text-gray-500">Você ainda não tem nenhuma configuração salva.</p>';
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
        historyList.innerHTML = '<p class="text-red-500">Erro ao carregar o histórico.</p>';
    }

    // 4. LOGOUT: Como sair do sistema?
    document.getElementById('btn-logout').addEventListener('click', () => {
        // Apagamos o bloco de notas!
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_nome');
        
        // E mandamos de volta para o login
        window.location.href = 'login.html';
    });
});