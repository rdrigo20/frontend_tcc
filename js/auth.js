document.getElementById('form-login').addEventListener('submit', function(e) {
    e.preventDefault(); // Impede a página de recarregar
    
    // Aqui no futuro você fará o fetch() para a API do WordPress para autenticar.
    // Para o protótipo, vamos forçar o login se houver texto nos campos:
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if(user && pass) {
        // Redireciona o usuário para a tela principal
        window.location.href = 'dashboard.html';
    } else {
        document.getElementById('login-msg').textContent = 'Preencha os dados.';
    }
});