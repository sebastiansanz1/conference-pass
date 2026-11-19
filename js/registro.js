
import { db, auth } from "../firebase.js";

import {
    collection,
    doc,
    setDoc,
    serverTimestamp
} from "firebase/firestore";

import {
    signInAnonymously
} from "firebase/auth";

// Número oficial de WhatsApp del evento.
// Sustituye este valor por el número real del organizador.
// Formato internacional, solamente números.
const WHATSAPP_EVENTO = "525521459320";

// Elementos del formulario
const formulario = document.getElementById("registrationForm");
const botonRegistro = document.getElementById("submitButton");
const mensaje = document.getElementById("formMessage");

const panelExito = document.getElementById("successPanel");
const folioElemento = document.getElementById("registrationFolio");

const botonWhatsApp = document.getElementById("whatsappButton");
const botonContinuar = document.getElementById("continueButton");

// Generar identificador seguro a partir del correo
async function generarIdentificador(correo) {

    const datos = new TextEncoder().encode(correo);

    const hash = await crypto.subtle.digest("SHA-256", datos);

    return Array.from(new Uint8Array(hash))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

// Registrar asistente
formulario.addEventListener("submit", async (event) => {

    event.preventDefault();

    mensaje.textContent = "";

    botonRegistro.disabled = true;
    botonRegistro.textContent = "Procesando registro...";

    try {

        // Obtener información del formulario
        const nombre = document.getElementById("nombre")
            .value.trim();

        const apellidos = document.getElementById("apellidos")
            .value.trim();

        const correo = document.getElementById("correo")
            .value.trim().toLowerCase();

        const whatsapp = document.getElementById("whatsapp")
            .value.trim();

        // Validar longitud y formato
        if (
            nombre.length < 2 ||
            apellidos.length < 2 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ||
            !/^[0-9]{10}$/.test(whatsapp)
        ) {
            throw new Error("Verifica que todos tus datos sean correctos.");
        }

        // Obtener autenticación anónima
        if (!auth.currentUser) {
            await signInAnonymously(auth);
        }

        // Identificador único del asistente
        const identificador = await generarIdentificador(correo);

        // Generar folio
        const folio = "CP-" + identificador.substring(0, 8).toUpperCase();

        // Referencia al documento
        const referencia = doc(db, "asistentes", identificador);

        // Guardar información en Firestore
        await setDoc(referencia, {

            nombre,
            apellidos,
            correo,
            whatsapp,

            fechaRegistro: serverTimestamp(),

            uid: auth.currentUser.uid

        });

        // Guardar identificador para el siguiente módulo
        sessionStorage.setItem("conferenceAssistantId", identificador);
        sessionStorage.setItem("conferenceFolio", folio);

        // Mostrar folio
        folioElemento.textContent = folio;

        // Preparar mensaje de WhatsApp
        const numeroConfigurado =
            /^\d{10,15}$/.test(WHATSAPP_EVENTO);

        if (numeroConfigurado) {

            const texto = `
Hola, acabo de realizar mi registro para la conferencia magistral "El Futuro es Ahora".

Nombre: ${nombre} ${apellidos}
Folio: ${folio}

Me gustaría confirmar mi registro. ¡Gracias!
            `;

            botonWhatsApp.href =
                `https://wa.me/${WHATSAPP_EVENTO}?text=${encodeURIComponent(texto)}`;

            botonWhatsApp.hidden = false;

        } else {

            botonWhatsApp.hidden = true;

            mensaje.textContent =
                "Registro guardado. Falta configurar el WhatsApp oficial del evento.";
        }

        // Mostrar confirmación
        formulario.hidden = true;
        panelExito.hidden = false;

    } catch (error) {

        console.error("Error en el registro:", error);

        if (error.code === "permission-denied") {

            mensaje.textContent =
                "Este correo ya está registrado o no tienes permisos para realizar el registro.";

        } else {

            mensaje.textContent =
                error.message || "No fue posible completar el registro.";
        }

    } finally {

        botonRegistro.disabled = false;
        botonRegistro.textContent = "Registrarme y continuar ↗";
    }

});

// Continuar a selección de asientos
botonContinuar.addEventListener("click", () => {

    const asistente = sessionStorage.getItem("conferenceAssistantId");

    if (!asistente) {
        alert("Primero debes completar tu registro.");
        return;
    }

    window.location.href = "asientos.html";

});
