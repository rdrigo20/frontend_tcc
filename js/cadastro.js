document.getElementById('form-cadastro').addEventListener('submit', async function(e) {
    e.preventDefault(); // Impede o recarregamento da página

    // Captura os elementos e os valores
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    
    const msgBox = document.getElementById('cadastro-msg');
    const btnSubmit = document.getElementById('btn-submit');

    // 1. Validação básica (As senhas batem?)
    if (password !== confirmPassword) {
        exibirMensagem('As senhas não coincidem. Tente novamente.', 'erro');
        return;
    }

    if (password.length < 6) {
        exibirMensagem('A senha deve ter pelo menos 6 caracteres.', 'erro');
        return;
    }

    // 2. Prepara os dados para enviar para o backend
    const payload = {
        nome: nome,
        email: email,
        username: username,
        password: password
    };

    // Altera o estado do botão para indicar carregamento
    btnSubmit.textContent = 'Criando conta...';
    btnSubmit.disabled = true;
    btnSubmit.classList.add('opacity-50', 'cursor-not-allowed');
    msgBox.classList.add('hidden'); // Oculta mensagens antigas

    try {
        // Quando a sua API no WordPress estiver pronta, você fará a requisição aqui.
        // Exemplo de como será:
        /*
        const response = await fetch('http://localhost/seu-wp/wp-json/wp/v2/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error('Erro ao criar usuário');
        */

        // Simulando o tempo de resposta do servidor (Protótipo)
        setTimeout(() => {
            exibirMensagem('Conta criada com sucesso! Redirecionando...', 'sucesso');
            
            // Redireciona para o login após 2 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        }, 1500);

    } catch (error) {
        exibirMensagem('Ocorreu um erro ao comunicar com o servidor.', 'erro');
        
        // Restaura o botão
        btnSubmit.textContent = 'Cadastrar';
        btnSubmit.disabled = false;
        btnSubmit.classList.remove('opacity-50', 'cursor-not-allowed');
    }
});

// Função auxiliar para exibir as mensagens de erro ou sucesso
function exibirMensagem(texto, tipo) {
    const msgBox = document.getElementById('cadastro-msg');
    msgBox.textContent = texto;
    msgBox.classList.remove('hidden', 'text-red-500', 'text-green-500');
    
    if (tipo === 'erro') {
        msgBox.classList.add('text-red-500');
    } else if (tipo === 'sucesso') {
        msgBox.classList.add('text-green-500');
    }
}