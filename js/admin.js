import { db, auth } from "../firebase.js";

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    runTransaction,
    serverTimestamp
} from "firebase/firestore";

import { Html5Qrcode } from "html5-qrcode";

// Elementos
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

const logoutButton = document.getElementById("logoutButton");
const startScannerButton = document.getElementById("startScannerButton");
const refreshButton = document.getElementById("refreshButton");

const scannerMessage = document.getElementById("scannerMessage");

const resultCard = document.getElementById("resultCard");
const resultIcon = document.getElementById("resultIcon");
const resultTitle = document.getElementById("resultTitle");
const resultDescription = document.getElementById("resultDescription");

let scanner = null;
let scannerRunning = false;
let processing = false;

// Comprobar que el usuario realmente sea administrador
async function verifyAdmin(user) {
    const adminRef = doc(db, "administradores", user.uid);
    const adminSnapshot = await getDoc(adminRef);

    if (!adminSnapshot.exists()) {
        return false;
    }

    const adminData = adminSnapshot.data();

    return adminData.rol === "admin" && adminData.activo === true;
}

// Mostrar el panel
async function showDashboard(user) {
    const isAuthorized = await verifyAdmin(user);

    if (!isAuthorized) {
        await signOut(auth);
        loginSection.hidden = false;
        dashboardSection.hidden = true;

        loginMessage.textContent =
            "Esta cuenta no tiene permisos de administrador.";

        return;
    }

    loginSection.hidden = true;
    dashboardSection.hidden = false;

    await loadStatistics();
}

// Inicio de sesión
loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginButton.disabled = true;
    loginButton.textContent = "Verificando...";
    loginMessage.textContent = "";

    try {
        const credential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        await showDashboard(credential.user);

    } catch (error) {
        console.error("Error de inicio de sesión:", error);

        loginMessage.textContent =
            "No se pudo iniciar sesión. Revisa tus datos.";

    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Iniciar sesión";
    }
});

// Cerrar sesión
logoutButton.addEventListener("click", async () => {
    await stopScanner();
    await signOut(auth);

    dashboardSection.hidden = true;
    loginSection.hidden = false;
    loginMessage.textContent = "";
});

// Estadísticas
async function loadStatistics() {
    try {
        const [reservationsSnapshot, attendanceSnapshot] =
            await Promise.all([
                getDocs(collection(db, "reservaciones")),
                getDocs(collection(db, "asistencias"))
            ]);

        const reservations = reservationsSnapshot.size;
        const attendances = attendanceSnapshot.size;

        const capacity = 100;
        const available = Math.max(0, capacity - reservations);

        document.getElementById("capacityCount").textContent = capacity;
        document.getElementById("reservationCount").textContent = reservations;
        document.getElementById("attendanceCount").textContent = attendances;
        document.getElementById("availableCount").textContent = available;

    } catch (error) {
        console.error("Error al cargar estadísticas:", error);
        scannerMessage.textContent =
            "No se pudieron cargar las estadísticas.";
    }
}

refreshButton.addEventListener("click", loadStatistics);

// Mostrar resultado del escaneo
function showResult(type, title, description) {
    resultCard.hidden = false;

    resultIcon.textContent = type === "success" ? "✓" :
        type === "warning" ? "!" : "×";

    resultIcon.style.background = type === "success" ? "#123d35" :
        type === "warning" ? "#49371b" : "#491f2a";

    resultIcon.style.color = type === "success" ? "#4ade80" :
        type === "warning" ? "#fbbf24" : "#fb7185";

    resultTitle.textContent = title;
    resultDescription.textContent = description;
}

// Detener cámara
async function stopScanner() {
    if (scanner && scannerRunning) {
        await scanner.stop();
        scannerRunning = false;
    }
}

// Validar el QR y registrar la entrada
async function validateTicket(qrText) {
    if (processing) return;

    processing = true;
    await stopScanner();

    scannerMessage.textContent = "Validando boleto...";

    try {
        let qrData;

        try {
            qrData = JSON.parse(qrText);
        } catch {
            throw new Error("El código QR no tiene un formato válido.");
        }

        if (
            qrData.tipo !== "CONFERENCE_PASS" ||
            typeof qrData.reservaId !== "string" ||
            !qrData.reservaId
        ) {
            throw new Error("Este código no pertenece a Conference Pass.");
        }

        const reservationId = qrData.reservaId;

        const reservationRef = doc(
            db,
            "reservaciones",
            reservationId
        );

        const attendanceRef = doc(
            db,
            "asistencias",
            reservationId
        );

        const result = await runTransaction(db, async transaction => {

            // Todas las lecturas antes de las escrituras
            const reservationSnapshot =
                await transaction.get(reservationRef);

            const attendanceSnapshot =
                await transaction.get(attendanceRef);

            if (!reservationSnapshot.exists()) {
                throw new Error("La reservación no existe.");
            }

            if (attendanceSnapshot.exists()) {
                return {
                    status: "already-used",
                    reservation: reservationSnapshot.data()
                };
            }

            const reservation = reservationSnapshot.data();

            transaction.set(attendanceRef, {
                reservaId: reservationId,
                asientoId: reservation.asientoId,
                folio: reservation.folio,
                fechaEntrada: serverTimestamp(),
                registradoPor: auth.currentUser.uid
            });

            return {
                status: "valid",
                reservation
            };
        });

        if (result.status === "already-used") {
            showResult(
                "warning",
                "Boleto ya utilizado",
                `El asiento ${result.reservation.asientoId} ya registró su entrada.`
            );

        } else {
            showResult(
                "success",
                "¡Entrada autorizada!",
                `Folio: ${result.reservation.folio} | Asiento: ${result.reservation.asientoId}`
            );
        }

        await loadStatistics();

    } catch (error) {
        console.error("Error al validar boleto:", error);

        showResult(
            "error",
            "Boleto no válido",
            error.message || "No se pudo validar el código."
        );

    } finally {
        scannerMessage.textContent =
            "Puedes escanear el siguiente boleto.";

        processing = false;
    }
}

// Activar cámara
startScannerButton.addEventListener("click", async () => {
    if (scannerRunning || processing) return;

    resultCard.hidden = true;
    scannerMessage.textContent = "Solicitando acceso a la cámara...";

    try {
        if (!scanner) {
            scanner = new Html5Qrcode("reader");
        }

        await scanner.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            async decodedText => {
                if (!processing) {
                    await validateTicket(decodedText);
                }
            },
            () => {}
        );

        scannerRunning = true;
        scannerMessage.textContent =
            "Cámara activa. Coloca el código QR frente a ella.";

    } catch (error) {
        console.error("Error al iniciar cámara:", error);

        scannerMessage.textContent =
            "No se pudo activar la cámara. Comprueba los permisos del navegador.";

    }
});

// Recuperar sesión del administrador al recargar
onAuthStateChanged(auth, async user => {
    if (user && !user.isAnonymous) {
        await showDashboard(user);
    } else {
        loginSection.hidden = false;
        dashboardSection.hidden = true;
    }
});