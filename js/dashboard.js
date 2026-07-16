document.addEventListener('DOMContentLoaded', () => {
    const historyList = document.getElementById('history-list');
    
    // Simulação de dados vindo da API do WordPress (Custom Post Types)
    const mockHistorico = [
        { id: 1, rede: '192.168.1.0/24', data: '16/07/2026' },
        { id: 2, rede: '10.0.0.0/8', data: '15/07/2026' }
    ];

    historyList.innerHTML = ''; // Limpa o "Carregando"

    mockHistorico.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div>
                <strong>Rede:</strong> ${item.rede}
            </div>
            <div>
                <span>Gerado em: ${item.data}</span>
            </div>
        `;
        historyList.appendChild(div);
    });

    // Função de Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
        window.location.href = 'login.html';
    });
});