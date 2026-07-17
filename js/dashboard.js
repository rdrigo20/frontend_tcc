document.addEventListener('DOMContentLoaded', () => {
    const historyList = document.getElementById('history-list');
    
    // Simulação de dados vindo da API do WordPress
    const mockHistorico = [
        { id: 1, rede: '192.168.1.0/24', data: '16/07/2026' },
        { id: 2, rede: '10.0.0.0/8', data: '15/07/2026' }
    ];

    historyList.innerHTML = ''; // Limpa o "Carregando"

    mockHistorico.forEach(item => {
        const div = document.createElement('div');
        // Usando classes do Tailwind para o card de histórico
        div.className = 'bg-white p-4 border border-gray-200 rounded-lg flex justify-between items-center shadow-sm hover:shadow transition-shadow';
        div.innerHTML = `
            <div class="text-gray-800">
                <span class="font-semibold text-gray-600">Rede:</span> ${item.rede}
            </div>
            <div class="text-sm text-gray-500">
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