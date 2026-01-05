# 🎓 Curso Maestro: Desarrollo Full Stack - Proyecto GolazoStore

Bienvenido a la guía definitiva de aprendizaje basada en la arquitectura real de **GolazoStore**. Este documento combina la ruta de aprendizaje práctica con la teoría fundamental de las herramientas que utilizamos.

---

## 📂 Módulo 1: El Frontend (La Interfaz)
**Ubicación en proyecto:** `frontend/`

Aquí es donde vive todo lo que el usuario ve e interactúa. Es el punto de partida ideal.

### 1. HTML5 (Estructura)
Es el esqueleto de tus páginas (`index.html`, `catalogo.html`, etc.).
*   **Conceptos clave:** Etiquetas semánticas (`<header>`, `<main>`, `<footer>`), formularios, enlaces.
*   **📚 Dónde aprender:** [W3Schools HTML](https://www.w3schools.com/html/default.asp), [MDN Web Docs](https://developer.mozilla.org/es/docs/Web/HTML).

### 2. CSS3 (Estilo y Diseño)
Define cómo se ve tu tienda (`css/style.css`).
*   **Conceptos clave:** Flexbox, Grid, Media Queries (Responsive Design), Animaciones.
*   **📚 Dónde aprender:** [Flexbox Froggy](https://flexboxfroggy.com/#es), [Kevin Powell (YouTube)](https://www.youtube.com/user/kepowob).

### 3. JavaScript (Lógica del Cliente)
Da vida a la página: carrito de compras, peticiones al servidor (`js/main.js`, `js/carrito.js`).
*   **Conceptos clave:** DOM Manipulation, Eventos, `fetch`, `localStorage`, JSON.
*   **📚 Dónde aprender:** [JavaScript.info](https://es.javascript.info/), [MDN Guide](https://developer.mozilla.org/es/docs/Web/JavaScript/Guide).

---

## 📂 Módulo 2: El Backend (El Cerebro)
**Ubicación en proyecto:** `backend/`

Aquí ocurre la magia oculta: procesar pedidos, guardar usuarios y servir datos.

### 1. Node.js (El Motor)
Node.js es un entorno de ejecución que permite usar JavaScript en el servidor (backend), no solo en el navegador.

*   **🎯 ¿Para qué sirve?**
    *   Crear servidores web (APIs REST).
    *   Procesar datos y conectar con bases de datos.
    *   Autenticación de usuarios.

*   **🏗️ Arquitectura:**
    ```
    🌐 Navegador (Frontend) <--> 🖥️ Servidor Node.js (Backend) <--> 🗄️ Base de Datos SQLite
    ```

*   **📚 Dónde aprender:** [Node.js Docs](https://nodejs.org/es/docs/), [Fazt Tech (YouTube)](https://www.youtube.com/watch?v=BhvLIzVL8_o).

### 2. NPM (Gestor de Paquetes)
Es la "tienda de aplicaciones" para desarrolladores Node.js. Permite instalar librerías creadas por otros.

*   **📋 Comandos Esenciales:**
    ```bash
    npm init -y          # Inicializar proyecto (crea package.json)
    npm install express  # Instalar una librería
    npm run dev          # Ejecutar script de desarrollo
    ```

### 3. Express.js (El Framework)
Framework minimalista para Node.js que facilita la creación de servidores y APIs.

*   **🎯 Funciones principales:**
    *   **Rutas:** Define qué pasa cuando visitas `/api/productos`.
    *   **Middleware:** Funciones que se ejecutan antes de llegar a la ruta (ej: verificar login).

*   **🔧 Código Básico:**
    ```javascript
    const express = require('express');
    const app = express();
    
    app.use(express.json()); // Middleware para entender JSON
    
    app.get('/api/productos', (req, res) => {
        res.json({ mensaje: 'Lista de productos' });
    });
    
    app.listen(3000, () => console.log('Servidor corriendo'));
    ```
*   **📚 Dónde aprender:** [Express.js Guía](https://expressjs.com/es/starter/installing.html).

### 4. Multer (Subida de Archivos)
Middleware para manejar la subida de imágenes (ej: fotos de camisetas).

*   **🔧 Ejemplo de uso:**
    ```javascript
    const upload = multer({ dest: 'uploads/' });
    app.post('/api/upload', upload.single('imagen'), (req, res) => {
        res.json({ archivo: req.file.filename });
    });
    ```

---

## 📂 Módulo 3: Base de Datos (La Memoria)
**Ubicación en proyecto:** `backend/database/`

### 1. SQLite (Base de Datos Relacional Ligera)
El "almacén digital" donde guardamos usuarios, productos y pedidos (`golazostore.db`).

*   **🎯 ¿Para qué sirve?**
    *   Almacenar datos de forma estructurada en tablas.
    *   Relacionar datos (ej: un Pedido pertenece a un Usuario).
    *   **Ventaja:** No requiere instalar un servidor separado (es un archivo).

*   **🔧 Comandos SQL Básicos:**
    ```sql
    -- Los comandos son muy similares a MySQL
    CREATE TABLE usuarios (    -- Crear tabla
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255)
    );
    
    SELECT * FROM usuarios;    -- Ver todos los usuarios
    ```
*   **📚 Dónde aprender:** [SQLite Tutorial](https://www.sqlitetutorial.net/), [W3Schools SQL](https://www.w3schools.com/sql/).

### 2. DB Browser for SQLite (Interfaz Gráfica)
Herramienta visual para ver y editar tu archivo `.db`.
*   **Funciones:** Ver tablas, ejecutar SQL, explorar datos.

---

## 📂 Módulo 4: Seguridad y Autenticación
**Ubicación en proyecto:** `backend/src/middleware/auth.js`

### 1. Bcrypt (Encriptación)
Librería para encriptar contraseñas. **Nunca** guardamos contraseñas en texto plano.

*   **🔒 ¿Por qué es importante?**
    *   Si hackean la base de datos, no podrán leer las contraseñas de los usuarios.
    *   Ejemplo: `123456` se convierte en `$2b$10$N9qo8uLOickgx2ZMRZoMye...`

### 2. JWT (JSON Web Tokens)
Es un "pase de acceso" digital seguro.

*   **🔄 Flujo de Autenticación:**
    1.  Usuario hace Login con email/pass.
    2.  Servidor valida y genera un **Token JWT**.
    3.  Cliente guarda el Token (localStorage).
    4.  Cliente envía el Token en cada petición para acceder a rutas privadas (ej: "Mi Perfil").

*   **🔧 Código Middleware:**
    ```javascript
    const token = req.headers['authorization'];
    const decoded = jwt.verify(token, 'secreto');
    ```
*   **📚 Dónde aprender:** [JWT.io](https://jwt.io/), [Auth0 Blog](https://auth0.com/blog/).

### 3. CORS (Seguridad entre Dominios)
Permite que tu Frontend (puerto 8000/5500) hable con tu Backend (puerto 3000). Sin esto, el navegador bloquea las peticiones por seguridad.

---

## 📂 Módulo 5: Herramientas Profesionales

### 1. Git y GitHub (Control de Versiones)
Git es la máquina del tiempo de tu código. GitHub es la nube donde se guarda.

*   **🎯 Beneficios:** Historial de cambios, trabajo en equipo, respaldo en la nube.
*   **📋 Comandos Esenciales:**
    ```bash
    git add .           # Preparar cambios
    git commit -m "msg" # Guardar cambios en historial
    git push            # Subir a la nube
    git pull            # Bajar cambios
    ```
*   **📚 Dónde aprender:** [Git - The Simple Guide](https://rogerdudler.github.io/git-guide/index.es.html).

### 2. Postman (Testing de APIs)
Herramienta para probar tu Backend sin necesidad de tener el Frontend listo.

*   **🎯 Uso:**
    *   Probar endpoints (GET, POST, PUT, DELETE).
    *   Simular ser el cliente enviando JSON.
    *   Verificar respuestas y códigos de error (200, 404, 500).

---

## 🚀 Módulo 6: Despliegue (El Gran Final)

### Cloud Hosting
*   **Frontend:** Netlify o Vercel (para archivos estáticos HTML/CSS/JS).
*   **Backend:** Railway o Render (para correr Node.js).
*   **Base de Datos:** SQLite (archivo incluido) o PostgreSQL/MySQL para producción real.

---

### 💡 Consejo Final
Sigue el orden de las carpetas de tu proyecto:
1.  Domina el **Frontend** (HTML/CSS/JS).
2.  Entiende cómo funciona el **Backend** (Node/Express).
3.  Aprende a guardar datos en **SQLite**.
4.  Conecta todo.

¡Mucha suerte en tu aprendizaje!
