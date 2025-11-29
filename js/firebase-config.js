// js/firebase-config.js

// Importa a função necessária do SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyCuWJYHR_n3riRVLGy1e-WeMGNgyDYJaPU",
    authDomain: "christianbotproject.firebaseapp.com",
    databaseURL: "https://christianbotproject-default-rtdb.firebaseio.com",
    projectId: "christianbotproject",
    storageBucket: "christianbotproject.firebasestorage.app",
    messagingSenderId: "134287955703",
    appId: "1:134287955703:web:3a1281b57b626f59e765f2",
    measurementId: "G-YVT1XN1FSN"
};

const app = initializeApp(firebaseConfig);

export { app };