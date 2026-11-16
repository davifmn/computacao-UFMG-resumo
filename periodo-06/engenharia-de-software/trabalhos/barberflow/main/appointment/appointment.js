const container = document.getElementById('boardContainer');
const btnConfirm = document.getElementById('btnConfirm');

// Pega dados do LocalStorage
const maxSlots = parseInt(localStorage.getItem('selectedServicesCount')) || 1;
const selectedServices = JSON.parse(localStorage.getItem('selectedServices')) || [];
const selectedWorkerId = localStorage.getItem('selectedWorkerId') || 'any';

let selectedSlots = []; 
let serverBoard = null; // Variável para armazenar o board que virá do servidor

const headerTitle = document.querySelector('.header h2');
if (headerTitle) {
    headerTitle.innerText = `Selecione ${maxSlots} horário(s)`;
}

// Botão de voltar
document.getElementById('btnBack').addEventListener('click', () => {
    window.location.href = '../home_screen/home_screen.html';
});

// Busca os horários reais no banco de dados
async function fetchBoard() {
    try {
        const response = await fetch('http://localhost:3000/api/workers/board', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workerId: selectedWorkerId, services: selectedServices })
        });
        
        if (!response.ok) throw new Error('Erro ao buscar o quadro');
        
        serverBoard = await response.json();
        renderBoard(); // Renderiza somente DEPOIS de receber os dados
    } catch (error) {
        container.innerHTML = '<p style="color:red;">Não foi possível carregar os horários. Volte e tente novamente.</p>';
    }
}

// Renderizar o quadro
function renderBoard() {
    if (!serverBoard) return;
    container.innerHTML = '';

    const emptyCorner = document.createElement('div');
    emptyCorner.className = 'cell header-cell';
    container.appendChild(emptyCorner);

    serverBoard.days.forEach(day => {
        const div = document.createElement('div');
        div.className = 'cell header-cell';
        div.innerText = day;
        container.appendChild(div);
    });

    serverBoard.hours.forEach(hour => {
        const timeDiv = document.createElement('div');
        timeDiv.className = 'cell time-cell';
        timeDiv.innerText = hour;
        container.appendChild(timeDiv);

        serverBoard.days.forEach(day => {
            const status = serverBoard.schedule[day][hour];
            const slot = document.createElement('div');
            slot.className = `cell slot ${status}`;
            slot.innerText = status === 'free' ? 'Livre' : 'Ocupado';

            if (status === 'free') {
                slot.addEventListener('click', () => selectSlot(slot, day, hour));
            }

            container.appendChild(slot);
        });
    });
}

function selectSlot(element, day, hour) {
    const index = selectedSlots.findIndex(slot => slot.day === day && slot.time === hour);

    if (index > -1) {
        selectedSlots[index].element.classList.remove('selected');
        selectedSlots[index].element.innerText = 'Livre';
        selectedSlots.splice(index, 1);
    } else {
        if (selectedSlots.length >= maxSlots) {
            alert(`Você deve selecionar exatamente ${maxSlots} horário(s) para os serviços escolhidos.`);
            return;
        }
        selectedSlots.push({ day, time: hour, element });
        element.classList.add('selected');
        element.innerText = 'Selecionado';
    }

    btnConfirm.disabled = selectedSlots.length !== maxSlots;
}

btnConfirm.addEventListener('click', () => {
    if (selectedSlots.length === maxSlots) {
        localStorage.setItem('finalSlots', JSON.stringify(selectedSlots));
        window.location.href = '../confirm_screen/confirm.html';
    }
});

// Inicia buscando o board do servidor em vez de tentar renderizar o vazio
fetchBoard();