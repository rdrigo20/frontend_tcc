document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. VERIFICAÇÃO DE AUTENTICAÇÃO
    const userId = localStorage.getItem('user_id');
    const userNome = localStorage.getItem('user_nome');

    // Bloqueia acesso de anônimos
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    // 2. MENSAGEM DE BOAS-VINDAS
    const saudacao = document.querySelector('header span');
    if (saudacao) {
        saudacao.textContent = `Olá, ${userNome}!`;
    }

    const historyList = document.getElementById('history-list');
    
    // Rota GET para puxar todas as conversas deste usuário
    const API_URL = `http://localhost/arquivos_wordpress/wp-json/api/conversa/usuario/${userId}`;

    try {
        console.log("1. Buscando histórico...");
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`Erro do servidor: ${response.status}`);

        const historico = await response.json();
        
        historyList.innerHTML = ''; // Limpa o "Carregando..." da tela

        // Se o array vier vazio ou com erro, exibe mensagem amigável
        if (historico.code || !Array.isArray(historico) || historico.length === 0) {
            historyList.innerHTML = '<p class="text-gray-500 italic">Você ainda não tem nenhuma configuração salva.</p>';
            return;
        }

        // 3. DESENHA CADA CONVERSA NA TELA
        historico.forEach(item => {
            const div = document.createElement('div');
            div.className = 'bg-white p-4 border border-gray-200 rounded-lg flex justify-between items-center shadow-sm hover:shadow transition-shadow mb-3';
            
            // Injeta o HTML da linha da conversa. 
            // NOTA: Isolei o título em um <span> com a classe "titulo-texto" para podermos mudá-lo facilmente via JS depois.
            div.innerHTML = `
                <div class="text-gray-800 flex-1 truncate pr-4">
                    <span class="font-semibold text-gray-600">Título:</span> 
                    <span class="titulo-texto">${item.titulo}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap">
                    <span class="hidden md:inline">Criado em: ${item.data}</span>
                    
                    <!-- NOVO: Botão de Editar (Lápis Azul) -->
                    <button class="btn-editar text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 rounded-full transition-colors" title="Renomear conversa">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>

                    <!-- Botão de Deletar (Lixeira Vermelha) -->
                    <button class="btn-deletar text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors" title="Apagar histórico">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            `;
            
            // Captura os elementos específicos DESTA linha recém-criada
            const btnEditar = div.querySelector('.btn-editar');
            const btnDeletar = div.querySelector('.btn-deletar');
            const spanTitulo = div.querySelector('.titulo-texto');
            
            // ==========================================
            // EVENTO: RENOMEAR CONVERSA (PUT)
            // ==========================================
            btnEditar.addEventListener('click', async () => {
                // Abre uma janela nativa do navegador pedindo o novo nome (já vem preenchido com o antigo)
                const novoTitulo = prompt("Digite o novo nome para esta configuração:", spanTitulo.textContent);
                
                // Se o usuário clicar em "Cancelar" (null) ou deixar em branco, abortamos.
                // Se ele enviar exatamente o mesmo nome, abortamos para economizar processamento.
                if (!novoTitulo || novoTitulo.trim() === '' || novoTitulo === spanTitulo.textContent) {
                    return; 
                }

                try {
                    // Efeito visual de carregamento no botão
                    btnEditar.classList.add('opacity-50', 'cursor-wait');
                    
                    // Faz a requisição PUT para o endpoint atualizado
                    const updateResponse = await fetch(`http://localhost/arquivos_wordpress/wp-json/api/conversa/${item.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ titulo: novoTitulo.trim() }) // Envia o novo título no formato JSON
                    });

                    if (!updateResponse.ok) throw new Error('Falha ao renomear.');

                    // SUCESSO! Atualiza o texto na tela instantaneamente sem recarregar a página
                    spanTitulo.textContent = novoTitulo.trim();

                } catch (err) {
                    console.error("Erro ao renomear:", err);
                    alert("Erro ao tentar renomear a conversa. Tente novamente.");
                } finally {
                    // Tira o efeito de carregamento do botão
                    btnEditar.classList.remove('opacity-50', 'cursor-wait');
                }
            });

            // ==========================================
            // EVENTO: DELETAR CONVERSA (DELETE)
            // ==========================================
            btnDeletar.addEventListener('click', async () => {
                const confirmacao = confirm("Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.");
                if (!confirmacao) return;
                
                try {
                    btnDeletar.innerHTML = '<span class="text-xs font-bold px-1">...</span>';
                    btnDeletar.disabled = true;

                    const deleteResponse = await fetch(`http://localhost/arquivos_wordpress/wp-json/api/conversa/${item.id}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (!deleteResponse.ok) throw new Error('Falha ao deletar.');

                    // Animação de sumiço suave
                    div.style.transition = 'opacity 0.3s ease';
                    div.style.opacity = '0';
                    setTimeout(() => {
                        div.remove();
                        // Mostra aviso caso exclua o último item
                        if (historyList.children.length === 0) {
                            historyList.innerHTML = '<p class="text-gray-500 italic">Você ainda não tem nenhuma configuração salva.</p>';
                        }
                    }, 300);

                } catch (err) {
                    console.error("Erro ao deletar:", err);
                    alert("Erro ao tentar apagar a conversa. Tente novamente.");
                    btnDeletar.disabled = false;
                }
            });

            // Adiciona a linha pronta na lista principal
            historyList.appendChild(div); 
        });

    } catch (error) {
        console.error("ERRO FATAL:", error);
        historyList.innerHTML = `<p class="text-red-500 font-medium">Falha ao carregar histórico: ${error.message}</p>`;
    }

    // 4. LOGOUT
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.clear(); // Apaga todos os dados de login salvos
            window.location.href = 'login.html';
        });
    }
});