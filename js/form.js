document.getElementById('config-form').addEventListener('submit', async function(e) {
    e.preventDefault(); // Impede o envio padrão do formulário

    // Coleta os dados dos inputs
    const payload = {
        wan: document.getElementById('wan').value,
        lan: document.getElementById('lan').value,
        lan_network: document.getElementById('lan_network').value,
        policy: document.getElementById('policy').value,
        nat: document.getElementById('nat').checked
    };

    const resultadoBox = document.getElementById('resultado');
    const codigoPre = document.getElementById('codigo-gerado');
    
    resultadoBox.style.display = 'block';
    codigoPre.textContent = 'Enviando dados e gerando script...';

    try {
        // Substitua pela URL da sua API no WordPress depois
        /*
        const response = await fetch('http://localhost/seu-wp/wp-json/api/salvar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        */

        // Simulando a resposta para o protótipo:
        setTimeout(() => {
            codigoPre.textContent = `# Script gerado com sucesso!\n\n` +
                                    `iptables -P INPUT ${payload.policy}\n` +
                                    `iptables -P FORWARD ${payload.policy}\n\n` +
                                    `# NAT Status: ${payload.nat ? 'Ativado' : 'Desativado'}\n` +
                                    `iptables -t nat -A POSTROUTING -o ${payload.wan} -j MASQUERADE`;
        }, 1500);

    } catch (error) {
        codigoPre.textContent = 'Erro ao conectar com a API.';
    }
});