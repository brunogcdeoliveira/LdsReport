import { app } from './firebase-config.js'; // Importa a config
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth(app);
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede o recarregamento da página

    const email = emailInput.value;
    const password = passwordInput.value;
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Se o login for bem-sucedido, redireciona para o dashboard
        window.location.href = 'index.html';
    } catch (error) {
        // Se houver um erro, exibe uma mensagem amigável
        console.error("Erro de autenticação:", error.code);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage.textContent = 'E-mail ou senha inválidos.';
        } else {
            errorMessage.textContent = 'Ocorreu um erro ao tentar fazer login.';
        }
        errorMessage.classList.remove('hidden');
    }
});