document.getElementById('btnBack').addEventListener('click', () => {
    window.location.href = '../welcome/welcome_screen.html';
});

document.getElementById('signUpForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Pega os valores dos inputs
    const inputs = e.target.querySelectorAll('input');
    const name = inputs[0].value;
    const email = inputs[1].value;
    const password = inputs[2].value;

    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Cadastro realizado com sucesso!');
            // Armazena o nome do usuário no navegador para mostrar na Home
            localStorage.setItem('userName', data.user.name);
            window.location.href = '../../main/home_screen/home_screen.html';
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao conectar com o servidor.');
    }
});