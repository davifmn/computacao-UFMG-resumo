const workerListContainer = document.getElementById('workerList');

// Saudação
const storedName = localStorage.getItem('userName');
if (storedName) {
    document.getElementById('greeting').innerText = `Hello, ${storedName}`;
}

async function loadWorkers() {
    try {
        const response = await fetch('http://localhost:3000/api/workers');
        const workers = await response.json();
        
        workerListContainer.innerHTML = `
            <label class="service-option worker-option" data-id="any">
                <input type="radio" name="worker" value="any" checked>
                <div>
                    <strong>Qualquer Especialista</strong>
                    <div style="font-size: 12px; color: #666;">Ver todos os horários</div>
                </div>
            </label>
        `;

        workers.forEach(worker => {
            const specs = worker.specialties.join(', ');
            // Adicionamos as classes e o data-specialties aqui
            workerListContainer.innerHTML += `
                <label class="service-option worker-option" data-specialties="${specs}" data-id="${worker._id}">
                    <input type="radio" name="worker" value="${worker._id}">
                    <div>
                        <strong>${worker.name}</strong>
                        <div style="font-size: 12px; color: #666;">${specs}</div>
                    </div>
                    <span class="compatible-badge">✓ Atende</span>
                </label>
            `;
        });
    } catch (error) {
        workerListContainer.innerHTML = '<p style="color: red;">Erro ao carregar especialistas.</p>';
    }
}

// === NOVA LÓGICA DE DESTAQUE === 
function updateWorkerHighlights() {
    // Pega todos os serviços selecionados
    const selectedServiceCheckboxes = document.querySelectorAll('input[name="service"]:checked');
    const selectedServices = Array.from(selectedServiceCheckboxes).map(cb => cb.value);
    
    const workerOptions = document.querySelectorAll('.worker-option');

    workerOptions.forEach(option => {
        if (option.dataset.id === 'any') return; // Pula o "Qualquer Especialista"

        const workerSpecs = option.dataset.specialties || "";
        
        // Verifica se o especialista tem TODAS as especialidades marcadas
        const isCompatible = selectedServices.length > 0 && selectedServices.every(service => workerSpecs.includes(service));

        if (isCompatible) {
            option.classList.add('compatible');
            option.classList.remove('incompatible');
        } else if (selectedServices.length > 0) {
            option.classList.remove('compatible');
            option.classList.add('incompatible');
        } else {
            // Se nenhum serviço foi marcado, volta ao normal
            option.classList.remove('compatible');
            option.classList.remove('incompatible');
        }
    });
}

// Escuta os cliques nos serviços
document.querySelectorAll('input[name="service"]').forEach(checkbox => {
    checkbox.addEventListener('change', updateWorkerHighlights);
});
// =================================

document.getElementById('btnNext').addEventListener('click', () => {
    const selectedServiceCheckboxes = document.querySelectorAll('input[name="service"]:checked');
    const selectedWorker = document.querySelector('input[name="worker"]:checked');
    
    if (selectedServiceCheckboxes.length === 0) {
        alert('Por favor, selecione pelo menos um serviço.');
        return;
    }

    if (!selectedWorker) {
        alert('Por favor, selecione um especialista ou a opção "Qualquer Especialista".');
        return;
    }

    const selectedServices = Array.from(selectedServiceCheckboxes).map(cb => cb.value);

    // Impede o usuário de escolher um barbeiro que não faz o serviço (caso ele tente burlar)
    const workerLabel = selectedWorker.closest('.worker-option');
    if (workerLabel && workerLabel.classList.contains('incompatible')) {
        alert('Esse especialista não realiza todos os serviços selecionados. Por favor, escolha outro.');
        return;
    }

    localStorage.setItem('selectedServices', JSON.stringify(selectedServices));
    localStorage.setItem('selectedServicesCount', selectedServices.length);
    localStorage.setItem('selectedWorkerId', selectedWorker.value);

    window.location.href = '../appointment/appointment.html';
});

loadWorkers();