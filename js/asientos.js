import { db, auth } from "../firebase.js";

import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    runTransaction,
    setDoc,
    serverTimestamp
} from "firebase/firestore";

import { signInAnonymously } from "firebase/auth";

// Elementos HTML
const seatMap = document.getElementById("seatMap");
const selectedSeatElement = document.getElementById("selectedSeat");
const selectionMessage = document.getElementById("selectionMessage");
const reserveButton = document.getElementById("reserveButton");
const seatsMessage = document.getElementById("seatsMessage");

let selectedSeat = null;
let reserving = false;

const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

// Datos del registro anterior
const assistantId = sessionStorage.getItem("conferenceAssistantId");
const folio = sessionStorage.getItem("conferenceFolio");

// Preparar autenticación
async function prepareUser() {
    if (!assistantId || !folio) {
        window.location.href = "registro.html";
        return false;
    }

    if (!auth.currentUser) {
        await signInAnonymously(auth);
    }

    return true;
}

// Crear los 100 asientos en Firestore si no existen
async function initializeSeats() {
    for (const row of rows) {
        for (let number = 1; number <= 10; number++) {
            const seatId = `${row}${number}`;
            const seatRef = doc(db, "asientos", seatId);

            const seatSnapshot = await getDoc(seatRef);

            if (!seatSnapshot.exists()) {
                try {
                    await setDoc(seatRef, {
                        estado: "disponible"
                    });
                } catch (error) {
                    // Puede ocurrir si otra persona creó el asiento primero.
                    if (error.code !== "permission-denied") {
                        throw error;
                    }

                    const retrySnapshot = await getDoc(seatRef);

                    if (!retrySnapshot.exists()) {
                        throw error;
                    }
                }
            }
        }
    }
}

// Crear mapa visual
function generateSeats() {
    seatMap.innerHTML = "";

    rows.forEach(row => {
        const rowLabel = document.createElement("div");
        rowLabel.className = "seat-row-label";
        rowLabel.textContent = row;
        seatMap.appendChild(rowLabel);

        for (let number = 1; number <= 10; number++) {
            const seatId = `${row}${number}`;

            const seat = document.createElement("button");
            seat.type = "button";
            seat.className = "seat available";
            seat.textContent = number;
            seat.dataset.seat = seatId;

            seat.setAttribute(
                "aria-label",
                `Asiento ${seatId}, disponible`
            );

            seat.addEventListener("click", () => selectSeat(seat));

            seatMap.appendChild(seat);
        }
    });
}

// Escuchar cambios en Firestore
function listenToSeats() {
    const seatsRef = collection(db, "asientos");

    onSnapshot(seatsRef, snapshot => {
        snapshot.forEach(documentSnapshot => {
            const seatId = documentSnapshot.id;
            const data = documentSnapshot.data();

            const seat = document.querySelector(
                `[data-seat="${seatId}"]`
            );

            if (!seat) return;

            if (data.estado === "ocupado") {
                seat.className = "seat occupied";
                seat.disabled = true;
                seat.setAttribute(
                    "aria-label",
                    `Asiento ${seatId}, ocupado`
                );

                if (selectedSeat === seatId) {
                    selectedSeat = null;
                    selectedSeatElement.textContent = "Ninguno";
                    selectionMessage.textContent =
                        "Ese asiento acaba de ser reservado por otra persona.";
                    reserveButton.disabled = true;
                }
            } else {
                seat.className = "seat available";
                seat.disabled = false;
                seat.setAttribute(
                    "aria-label",
                    `Asiento ${seatId}, disponible`
                );
            }
        });
    }, error => {
        console.error("Error al escuchar asientos:", error);
        seatsMessage.textContent =
            "No se pudieron actualizar los asientos.";
    });
}

// Seleccionar asiento
function selectSeat(seat) {
    if (seat.disabled || reserving) return;

    document.querySelectorAll(".seat.selected").forEach(item => {
        item.classList.remove("selected");
        item.classList.add("available");
    });

    seat.classList.remove("available");
    seat.classList.add("selected");

    selectedSeat = seat.dataset.seat;

    selectedSeatElement.textContent = selectedSeat;
    selectionMessage.textContent =
        `Has seleccionado el asiento ${selectedSeat}.`;

    reserveButton.disabled = false;
    seatsMessage.textContent = "";
}

// Reservar asiento realmente
async function reserveSelectedSeat() {
    if (!selectedSeat || reserving) return;

    const seatId = selectedSeat;

    reserving = true;
    reserveButton.disabled = true;
    reserveButton.textContent = "Reservando...";

    try {
        const seatRef = doc(db, "asientos", seatId);
        const reservationRef = doc(collection(db, "reservaciones"));

        await runTransaction(db, async transaction => {
            const seatSnapshot = await transaction.get(seatRef);

            if (!seatSnapshot.exists()) {
                throw new Error("El asiento no existe.");
            }

            if (seatSnapshot.data().estado !== "disponible") {
                throw new Error("Este asiento ya fue reservado.");
            }

            transaction.update(seatRef, {
                estado: "ocupado",
                reservaId: reservationRef.id
            });

            transaction.set(reservationRef, {
                uid: auth.currentUser.uid,
                asistenteId: assistantId,
                asientoId: seatId,
                folio: folio,
                fechaReserva: serverTimestamp()
            });
        });

        // --- REDIRECCIÓN AL BOLETO AGREGADA AQUÍ ---
        sessionStorage.setItem(
            "conferenceReservationId",
            reservationRef.id
        );

        window.location.href = "boleto.html";
        // -------------------------------------------

        selectedSeat = null;

        selectedSeatElement.textContent = "Ninguno";
        selectionMessage.textContent =
            "¡Tu asiento quedó reservado correctamente!";

        seatsMessage.textContent =
            `Reservación confirmada. Tu asiento es ${seatId}.`;

    } catch (error) {
        console.error("Error al reservar:", error);

        if (error.code === "permission-denied") {
            seatsMessage.textContent =
                "Firebase rechazó la reservación. Revisa las reglas de Firestore.";
        } else {
            seatsMessage.textContent = error.message ||
                "Ocurrió un error al reservar.";
        }
    } finally {
        reserving = false;
        reserveButton.disabled = true;
        reserveButton.textContent = "Reservar asiento";
    }
}

// Botón de reservación
reserveButton.addEventListener("click", reserveSelectedSeat);

// Iniciar aplicación
async function startSeats() {
    try {
        reserveButton.disabled = true;
        seatsMessage.textContent = "Cargando asientos...";

        const authenticated = await prepareUser();

        if (!authenticated) return;

        generateSeats();

        await initializeSeats();

        listenToSeats();

        seatsMessage.textContent = "Selecciona tu asiento disponible.";

    } catch (error) {
        console.error("Error al iniciar los asientos:", error);
        seatsMessage.textContent =
            "No se pudo cargar el mapa. Revisa la conexión con Firebase.";
    }
}

startSeats();