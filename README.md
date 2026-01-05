# 🛍️ GolazoStore - E-commerce de Camisetas de Fútbol

![Logo GolazoStore](frontend/assets/images/logo.png)

**GolazoStore** es una tienda online moderna y profesional especializada en la venta de camisetas de fútbol, tanto diseños retro como colecciones actuales. El proyecto combina un frontend atractivo con animaciones CSS modernas y un backend robusto con API REST, autenticación y base de datos SQLite.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Contribuir](#-contribuir)

---

## ✨ Características

### Frontend
- ✅ **Diseño Moderno**: Hero section con animaciones CSS y efectos de hover
- ✅ **Responsive**: Adaptado a móviles, tablets y escritorio
- ✅ **Branding Consistente**: Paleta de colores roja (#dc3545) coherente
- ✅ **Navegación Intuitiva**: Navbar fija, breadcrumbs, offcanvas de categorías
- ✅ **Carrito de Compras**: LocalStorage para persistencia del carrito
- ✅ **Animaciones**: Fade-in, pulse, hover effects
- ✅ **Iconografía**: FontAwesome 6.5.2

### Backend
- ✅ **API REST**: Endpoints para productos, usuarios y autenticación
- ✅ **Autenticación JWT**: Sistema de login y registro seguro
- ✅ **Base de Datos SQLite**: Base de datos ligera y eficiente (archivo local)
- ✅ **Subida de Archivos**: Multer para imágenes de productos
- ✅ **Middleware de Seguridad**: Validación y protección de rutas
- ✅ **CORS Configurado**: Comunicación frontend-backend

---

## 🚀 Tecnologías Utilizadas

### Frontend
- **HTML5** + **CSS3** (Bootstrap 5.3.3)
- **JavaScript** (ES6+)
- **FontAwesome** (Iconos)
- **Bootstrap** (Framework CSS)

### Backend
- **Node.js** (v16+)
- **Express.js** (Framework web)
- **SQLite** (Base de datos mediante `better-sqlite3`)
- **JWT** (JSON Web Tokens para autenticación)
- **Multer** (Subida de archivos)
- **bcrypt** (Encriptación de contraseñas)

---

## 📁 Estructura del Proyecto

```
tienda/
│
├── index.html                  # Página principal (raíz)
├── README.md                   # Este archivo
├── package.json                # Dependencias del proyecto
├── .gitignore                  # Archivos ignorados por Git
│
├── backend/                    # Servidor Node.js + API
│   ├── server.js               # Punto de entrada del servidor
│   ├── package.json            # Dependencias del backend
│   ├── database/
│   │   └── golazostore.db      # Archivo de base de datos SQLite
│   ├── src/
│   │   ├── controllers/        # Lógica de negocio
│   │   ├── middleware/         # Middlewares personalizados
│   │   ├── models/             # Modelos de datos
│   │   ├── routes/             # Definición de rutas
│   │   └── utils/              # Utilidades
│   └── uploads/                # Imágenes subidas
│
├── frontend/                   # Aplicación web (cliente)
│   ├── pages/                  # Páginas HTML
│   ├── css/                    # Estilos personalizados
│   ├── js/                     # JavaScript
│   └── assets/
│       └── images/             # Logo e imágenes
│
└── docs/                       # Documentación
```

---

## 🔧 Instalación

### Prerrequisitos

- **Node.js** (v16+) - [Descargar](https://nodejs.org/)
- **Git** - [Descargar](https://git-scm.com/)

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/faq55559589/tienda.git
cd tienda
```

### Paso 2: Instalar Dependencias del Backend

```bash
cd backend
npm install
```

### Paso 3: Configuración de Base de Datos

El proyecto utiliza **SQLite**, por lo que no es necesaria una configuración compleja de servidor. La base de datos se inicializará automáticamente o ya estará presente en `backend/database/golazostore.db`.

### Paso 4: Configurar Variables de Entorno

Crea un archivo `.env` en `backend/`:

```env
PORT=3000
JWT_SECRET=tu_clave_secreta
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:8000
NODE_ENV=development
```

---

## 🎯 Uso

### Iniciar Backend

```bash
cd backend
npm start
```

Servidor disponible en: `http://localhost:3000`

### Iniciar Frontend

Puedes usar Python (si lo tienes instalado) o cualquier servidor estático.

Opción A: **Python**
```bash
# Desde la raíz del proyecto
python -m http.server 8000
```
Luego abre `http://localhost:8000`

Opción B: **Live Server** (VS Code)
- Abre `index.html` → Click derecho → "Open with Live Server"

---

## 📡 API Endpoints

### Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Registrar usuario | No |
| POST | `/api/auth/login` | Iniciar sesión | No |
| GET | `/api/auth/profile` | Obtener perfil | Sí |

### Productos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | Listar productos | No |
| GET | `/api/products/:id` | Obtener producto | No |
| POST | `/api/products` | Crear producto | Sí |
| PUT | `/api/products/:id` | Actualizar producto | Sí |
| DELETE | `/api/products/:id` | Eliminar producto | Sí |

---

## 🎨 Paleta de Colores

```css
--color-primary: #dc3545;      /* Rojo principal */
--color-primary-dark: #bb2d3b; /* Rojo hover */
--color-bg-dark: #1a1a1a;      /* Negro principal */
```

---

## 🤝 Contribuir

1. Haz un **Fork** del proyecto
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit (`git commit -m 'Añadir funcionalidad'`)
4. Push (`git push origin feature/nueva-funcionalidad`)
5. Abre un **Pull Request**

---

## 👤 Autor

**Facundo Pintado**
- Instagram: [@facupintado_](https://www.instagram.com/facupintado_/)
- GitHub: [@faq55559589](https://github.com/faq55559589)

---

## 📞 Contacto

- 📧 Email: info@golazostore.com
- 📱 WhatsApp: +598 99 123 456
- 📍 Montevideo, Uruguay

---

<div align="center">
  <strong>Hecho con ❤️ por GolazoStore</strong>
  <br>
  <em>© 2025 GolazoStore. Todos los derechos reservados.</em>
</div>
