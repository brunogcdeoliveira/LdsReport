// js/auth-guard.js

import { app } from './firebase-config.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
    // Se não houver um usuário logado (user é null)
    if (!user) {
        // E a página atual NÃO for a de login, redireciona para o login
        if (window.location.pathname !== '/login.html') {
            console.log("Usuário não autenticado. Redirecionando para login...");
            window.location.href = 'login.html';
        }
    }
});