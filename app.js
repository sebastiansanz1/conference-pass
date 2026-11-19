
import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "firebase/firestore";

// Menú para dispositivos móviles
const menuButton = document.getElementById("menuButton");
const navLinks = document.querySelector(".nav-links");

menuButton.addEventListener("click", () => {
    navLinks.classList.toggle("active");

    menuButton.textContent = navLinks.classList.contains("active")
        ? "✕"
        : "☰";
});

document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        menuButton.textContent = "☰";
    });
});

// Consultar información de la conferencia
async function cargarConferencia() {

    try {
        const referencia = doc(db, "conferencias", "evento-2026");

        const resultado = await getDoc(referencia);

        if (resultado.exists()) {

            const conferencia = resultado.data();

            console.log("Conferencia obtenida:", conferencia);

            // Actualizar información de la página
            document.querySelector(".hero-pretitle").textContent =
                conferencia.tema.toUpperCase();

            document.querySelector(".hero-details div:nth-child(1) strong")
                .textContent = conferencia.fecha;

            document.querySelector(".hero-details div:nth-child(2) strong")
                .textContent = conferencia.hora;

            document.querySelector(".hero-details div:nth-child(3) strong")
                .textContent = conferencia.capacidad + " PERSONAS";

            console.log("Firebase conectado correctamente.");

        } else {
            console.log("No se encontró la conferencia.");
        }

    } catch (error) {
        console.error("Error al consultar Firebase:", error);
    }
}

cargarConferencia();
