document.getElementById('form-cadastro').addEventListener('submit', async function(e) {
    e.preventDefault(); 

    // Captura os valores
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const isProfessor = document.getElementById('professor').checked;
    
    const msgBox = document.getElementById('cadastro-msg');
    const btnSubmit = document.getElementById('btn-submit');

    // Validação de senhas
    if (password !== confirmPassword) {
        exibirMensagem('As senhas não coincidem.', 'erro');
        return;
    }

    if (password.length < 6) {
        exibirMensagem('A senha deve ter pelo menos 6 caracteres.', 'erro');
        return;
    }

    // O payload envia exatamente as chaves que o PHP precisa ler
    const payload = {
        nome: nome,
        email: email,
        cpf: cpf,
        senha: password,
        professor: isProfessor
    };

    btnSubmit.textContent = 'Criando conta...';
    btnSubmit.disabled = true;
    btnSubmit.classList.add('opacity-50', 'cursor-not-allowed');
    msgBox.classList.add('hidden'); 

    try {
        // Substitua pelo endereço real do seu WordPress
        const response = await fetch('http://localhost/arquivos_wordpress/wp-json/api/usuario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();

        if (!response.ok || data.code) {
            throw new Error(data.message || 'Erro ao criar usuário');
        }

        exibirMensagem('Conta criada com sucesso! Redirecionando...', 'sucesso');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (error) {
        exibirMensagem(error.message, 'erro');
        
        btnSubmit.textContent = 'Cadastrar';
        btnSubmit.disabled = false;
        btnSubmit.classList.remove('opacity-50', 'cursor-not-allowed');
    }
});

function exibirMensagem(texto, tipo) {
    const msgBox = document.getElementById('cadastro-msg');
    msgBox.textContent = texto;
    msgBox.classList.remove('hidden', 'text-red-500', 'text-green-500');
    
    if (tipo === 'erro') {
        msgBox.classList.add('text-red-500');
    } else {
        msgBox.classList.add('text-green-500');
    }
}