document.getElementById('btnBack').addEventListener('click', () => {
    window.location.href = '../welcome/welcome_screen.html';
});

document.getElementById('signInForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const inputs = e.target.querySelectorAll('input');
    const email = inputs[0].value;
    const password = inputs[1].value;

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Login realizado!');
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