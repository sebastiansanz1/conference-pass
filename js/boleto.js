import { db, auth } from "../firebase.js";

import {
    doc,
    getDoc
} from "firebase/firestore";

import QRCode from "qrcode";

import { signInAnonymously } from "firebase/auth";

const attendeeName = document.getElementById("attendeeName");
const speaker = document.getElementById("speaker");
const eventDate = document.getElementById("eventDate");
const eventTime = document.getElementById("eventTime");
const eventPlace = document.getElementById("eventPlace");
const seatNumber = document.getElementById("seatNumber");
const ticketFolio = document.getElementById("ticketFolio");
const ticketMessage = document.getElementById("ticketMessage");
const printButton = document.getElementById("printButton");
const qrImage = document.getElementById("qrCode");

const reservationId = sessionStorage.getItem(
    "conferenceReservationId"
);

const assistantId = sessionStorage.getItem(
    "conferenceAssistantId"
);

async function loadTicket() {
    try {
        if (!reservationId || !assistantId) {
            throw new Error("No encontramos tu reservación. Vuelve a registrarte.");
        }

        if (!auth.currentUser) {
            await signInAnonymously(auth);
        }

        // Recuperar reservación
        const reservationRef = doc(db, "reservaciones", reservationId);
        const reservationSnapshot = await getDoc(reservationRef);

        if (!reservationSnapshot.exists()) {
            throw new Error("La reservación no existe.");
        }

        const reservation = reservationSnapshot.data();

        if (
            reservation.uid !== auth.currentUser.uid ||
            reservation.asistenteId !== assistantId
        ) {
            throw new Error("Esta reservación no pertenece a tu sesión.");
        }

        // Recuperar asistente
        const assistantRef = doc(db, "asistentes", assistantId);
        const assistantSnapshot = await getDoc(assistantRef);

        if (!assistantSnapshot.exists()) {
            throw new Error("No encontramos los datos del asistente.");
        }

        const assistant = assistantSnapshot.data();

        // Recuperar conferencia
        const conferenceRef = doc(db, "conferencias", "evento-2026");
        const conferenceSnapshot = await getDoc(conferenceRef);

        if (!conferenceSnapshot.exists()) {
            throw new Error("No encontramos los datos del evento.");
        }

        const conference = conferenceSnapshot.data();

        // Mostrar información
        attendeeName.textContent =
            `${assistant.nombre} ${assistant.apellidos}`;

        speaker.textContent = conference.ponente || "Por confirmar";
        eventDate.textContent = conference.fecha || "Por confirmar";
        eventTime.textContent = conference.hora || "Por confirmar";
        eventPlace.textContent = conference.lugar || "Por confirmar";
        seatNumber.textContent = reservation.asientoId;
        ticketFolio.textContent = reservation.folio;

        // QR: solo contiene el identificador de la reservación.
        const qrData = JSON.stringify({
            tipo: "CONFERENCE_PASS",
            reservaId: reservationId
        });

        const qrUrl = await QRCode.toDataURL(qrData, {
            width: 166,
            margin: 1,
            errorCorrectionLevel: "H"
        });

        qrImage.src = qrUrl;

        ticketMessage.textContent =
            "Tu boleto digital está listo. ¡Nos vemos en el evento!";

        printButton.disabled = false;

    } catch (error) {
        console.error("Error al generar boleto:", error);

        ticketMessage.textContent =
            error.message || "No se pudo generar el boleto.";
    }
}

printButton.addEventListener("click", () => {
    window.print();
});

loadTicket();