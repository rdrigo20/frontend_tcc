document.getElementById('form-login').addEventListener('submit', async function(e) {
    e.preventDefault(); 
    
    // 1. Captura o que o usuário digitou
    const email = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const msgBox = document.getElementById('login-msg');

    // Limpa mensagens de erro antigas
    msgBox.textContent = 'Autenticando...';
    msgBox.classList.replace('text-red-500', 'text-blue-500');

    // 2. Prepara o pacote (JSON) para enviar
    const payload = {
        email: email,
        senha: password
    };

    try {
        // 3. O FETCH (O Carteiro)
        // Lembre-se de trocar "seu-wp" pelo nome da sua pasta no MAMP!
        const response = await fetch('http://localhost/arquivos_wordpress/wp-json/api/login', {
            method: 'POST', // Estamos enviando dados ocultos
            headers: {
                'Content-Type': 'application/json' // Avisa o WP que estamos mandando JSON
            },
            body: JSON.stringify(payload) // Transforma o objeto JS em texto JSON
        });

        const data = await response.json();

        // 4. Verifica se a senha estava errada (Erro 401)
        if (!response.ok || data.code) {
            throw new Error(data.message || 'Erro ao fazer login.');
        }

        // 5. LOGIN DEU CERTO! Salva os dados no navegador
        // O localStorage é a memória do navegador. Isso nos ajuda a lembrar quem 
        // está logado quando mudarmos para a página do Dashboard.
        localStorage.setItem('user_nome', data.dados.nome);
        localStorage.setItem('user_id', data.dados.id);

        msgBox.textContent = 'Login aprovado! Entrando...';
        msgBox.classList.replace('text-blue-500', 'text-green-500');

        // 6. Redireciona para o painel principal
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        // Se deu erro, mostra na tela
        msgBox.textContent = error.message;
        msgBox.classList.replace('text-blue-500', 'text-red-500');
    }
});