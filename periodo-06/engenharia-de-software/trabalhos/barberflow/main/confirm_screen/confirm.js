const summaryBox = document.getElementById('summaryBox');

const userName = localStorage.getItem('userName') || 'Usuário Não Identificado';
const userEmail = localStorage.getItem('userEmail') || 'Não informado';
const selectedServices = JSON.parse(localStorage.getItem('selectedServices')) || [];
const finalSlots = JSON.parse(localStorage.getItem('finalSlots')) || [];

summaryBox.innerHTML = `
    <p><strong>Nome:</strong> ${userName}</p>
    <p><strong>Email:</strong> ${userEmail}</p>
    <p><strong>Serviços selecionados:</strong> ${selectedServices.join(', ')}</p>
    <p><strong>Horários:</strong></p>
    <ul>
        ${finalSlots.map(slot => `<li>${slot.day} às ${slot.time}</li>`).join('')}
    </ul>
`;

document.getElementById('btnCopyPix').addEventListener('click', () => {
    const pixKey = document.getElementById('pixKey').innerText;
    navigator.clipboard.writeText(pixKey).then(() => {
        alert('Chave Pix copiada com sucesso!');
    }).catch(err => {
        console.error('Erro ao copiar', err);
    });
});

document.getElementById('btnConfirmFinal').addEventListener('click', () => {
    const selectedWorkerId = localStorage.getItem('selectedWorkerId') || 'any';
    
<<<<<<< HEAD
    try {
        // Envia o pedido para o Backend salvar os slots como ocupados
        const response = fetch('http://localhost:3000/api/workers/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                workerId: selectedWorkerId, 
                services: selectedServices, 
                slots: finalSlots 
            })
        });
=======
    localStorage.removeItem('selectedServices');
    localStorage.removeItem('selectedServicesCount');
    localStorage.removeItem('selectedWorkerId');
    localStorage.removeItem('finalSlots');
>>>>>>> c99781638ff964cd394a98500c3006ce303a0a21


        const data =  response.json();

        if (response.ok) {
            alert(`Agendamento finalizado com sucesso com o especialista ${data.workerName}! Muito obrigado.`);
            
            // Limpar apenas os dados de agendamento de transição
            localStorage.removeItem('selectedServices');
            localStorage.removeItem('selectedServicesCount');
            localStorage.removeItem('selectedWorkerId');
            localStorage.removeItem('finalSlots');

            window.location.href = '../home_screen/home_screen.html';
        } else {
            alert(data.error || 'Erro ao confirmar agendamento.');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao conectar com o servidor para confirmar o agendamento.');
    }
});

document.getElementById('btnBackToHome').addEventListener('click', () => {
    window.location.href = '../home_screen/home_screen.html';
});