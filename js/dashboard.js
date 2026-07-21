document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Verifica quem está logado
    const userId = localStorage.getItem('user_id');
    const userNome = localStorage.getItem('user_nome');

    // Se ninguém estiver logado, volta para a tela de login
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
            
            // Adicionado o container flex e o botão SVG de lixeira ao lado da data
            div.innerHTML = `
                <div class="text-gray-800">
                    <span class="font-semibold text-gray-600">Título:</span> ${item.titulo}
                </div>
                <div class="flex items-center gap-3 text-sm text-gray-500">
                    <span>Criado em: ${item.data}</span>
                    <button class="btn-deletar text-red-500 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 p-2 rounded-full" title="Apagar histórico">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            `;
            
            // Captura o botão de deletar que acabou de ser criado DENTRO desta div
            const btnDeletar = div.querySelector('.btn-deletar');
            
            // Adiciona o evento de clique para deletar
            btnDeletar.addEventListener('click', async () => {
                
                // Janela de confirmação do navegador
                const confirmacao = confirm("Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.");
                if (!confirmacao) return;
                
                try {
                    // Muda o visual do botão para mostrar que está carregando
                    btnDeletar.innerHTML = '<span class="text-xs font-bold">Apagando...</span>';
                    btnDeletar.disabled = true;

                    // Faz a requisição DELETE para a API
                    const deleteResponse = await fetch(`http://localhost/arquivos_wordpress/wp-json/api/conversa/${item.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!deleteResponse.ok) {
                        throw new Error('Falha ao deletar a conversa no banco de dados.');
                    }

                    // Se apagou com sucesso, removemos a div inteira da tela com uma animação rápida
                    div.style.opacity = '0';
                    setTimeout(() => {
                        div.remove();
                        
                        // Se era o último item da lista, mostramos a mensagem de vazio
                        if (historyList.children.length === 0) {
                            historyList.innerHTML = '<p class="text-gray-500 italic">Você ainda não tem nenhuma configuração salva.</p>';
                        }
                    }, 300);

                } catch (err) {
                    console.error("Erro ao deletar:", err);
                    alert("Erro ao tentar apagar a conversa. Tente novamente mais tarde.");
                    
                    // Restaura o ícone da lixeira caso dê erro
                    btnDeletar.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    `;
                    btnDeletar.disabled = false;
                }
            });

            // Adiciona a div (que contém a entrada do histórico) dentro da div history-list
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