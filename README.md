# Conference Pass 

**Sistema web de registro, reservación de asientos y control de acceso para conferencias.**

Conference Pass es una aplicación web desarrollada para administrar el proceso de registro de asistentes a una conferencia tecnológica. Permite registrar participantes, seleccionar asientos, generar boletos con códigos QR y gestionar el acceso mediante un panel administrativo.

El proyecto fue desarrollado como parte de nuestra formación en Desarrollo de Software, aplicando tecnologías web y servicios de Firebase.

---

##  Vista general

**Evento de demostración:** El Futuro es Ahora — Inteligencia Artificial e Innovación Tecnológica.

- Fecha: 20 de noviembre de 2026.
- Lugar: Auditorio Tecnológico.
- Capacidad: 100 asistentes.

> Aquí agregaremos capturas de pantalla de la aplicación para mostrar su funcionamiento.

<!-- Agregar imágenes dentro de una carpeta screenshots/ y actualizar las rutas -->
##  Funcionalidades principales

- **Registro de asistentes:** captura de datos personales y contacto.
- **Selección de asientos:** visualización y reservación de lugares disponibles.
- **Control de reservaciones:** almacenamiento de la información en Firestore.
- **Generación de boletos QR:** creación de un código QR asociado a cada reservación.
- **Panel administrativo:** acceso mediante autenticación.
- **Escaneo de códigos QR:** lectura de boletos para verificar el acceso.
- **Control de asistencia:** registro de entradas y prevención de registros duplicados.

##  Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| HTML5 | Estructura de las páginas |
| CSS3 | Diseño y estilos |
| JavaScript | Lógica de la aplicación |
| Vite | Entorno de desarrollo |
| Firebase Authentication | Autenticación de usuarios |
| Cloud Firestore | Base de datos NoSQL |
| QRCode | Generación de códigos QR |
| Html5-qrcode | Lectura de códigos QR |
| npm | Administración de dependencias |
| Git y GitHub | Control de versiones |

##  Estructura del proyecto

```text
conference-pass/
│
├── index.html
├── registro.html
├── boleto.html
├── asientos.html
├── admin.html
│
├── styles.css
├── firebase.js
├── app.js
│
├── css/
│   ├── registro.css
│   ├── asientos.css
│   ├── boleto.css
│   └── admin.css
│
├── js/
│   ├── registro.js
│   ├── asientos.js
│   ├── boleto.js
│   └── admin.js
│
├── package.json
├── package-lock.json
└── .gitignore
```
##  Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU-USUARIO/conference-pass.git
```

### 2. Entrar al proyecto

```bash
cd conference-pass
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Configurar Firebase

Crear o utilizar un proyecto de Firebase y configurar la aplicación web.

Actualizar `firebase.js` con la configuración correspondiente al proyecto de Firebase.

Habilitar los servicios necesarios:

- Firebase Authentication.
- Cloud Firestore.
- Autenticación anónima.
- Autenticación mediante correo electrónico y contraseña para administradores.

También es necesario configurar las reglas de seguridad de Firestore y preparar el documento del administrador.

### 5. Ejecutar la aplicación

```bash
npm run dev
```

Vite mostrará una dirección local para abrir la aplicación en el navegador.

##  Estructura de datos

El proyecto utiliza Cloud Firestore como base de datos NoSQL.

Las principales colecciones son:

| Colección | Descripción |
|---|---|
| `conferencias` | Información del evento |
| `asistentes` | Datos de los participantes |
| `asientos` | Disponibilidad de lugares |
| `reservaciones` | Reservaciones realizadas |
| `administradores` | Usuarios con permisos administrativos |
| `asistencias` | Registro de entradas al evento |

##  Seguridad

Se implementaron mecanismos de autenticación y reglas de seguridad en Firestore para controlar el acceso a la información.

El panel administrativo requiere autenticación y validación del rol del usuario.

**Importante:** No se deben publicar contraseñas, claves privadas, archivos de cuentas de servicio ni credenciales administrativas. Cada instalación debe utilizar su propia configuración de Firebase.

##  Equipo de desarrollo

Proyecto desarrollado en equipo por:

- Arath
- Sebastián
- Kevin
- Diego

##  Objetivo del proyecto

Desarrollar una solución web que facilite la administración de eventos mediante herramientas digitales, reduciendo procesos manuales en el registro de participantes, la asignación de asientos y el control de acceso.

Durante su desarrollo aplicamos conocimientos de programación web, integración de servicios en la nube, bases de datos NoSQL, autenticación y generación de códigos QR.

##  Estado del proyecto

Proyecto académico desarrollado con fines educativos y de demostración de habilidades de desarrollo web.

---

**Conference Pass** — Gestión de eventos de forma sencilla y organizada.