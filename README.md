# 🛵 Cenar (AppCenar)

Aplicación web de pedidos a domicilio desarrollada con **Node.js + Express** siguiendo el patrón de arquitectura **MVC**, con persistencia en **MongoDB** mediante **Mongoose**

Permite a los usuarios pedir comida y productos a comercios locales, con cuatro roles distintos: **Cliente**, **Comercio**, **Delivery** y **Administrador**.

---

## 🔗 Enlaces

- **Deployment en Railway:** `https://cenar.up.railway.app`
- **Repositorio:** este mismo repo

---

## 👤 Credenciales de administrador

```
Usuario:    admin
Contraseña: admin123
```

> El administrador por defecto se crea con el script `crear-admin.js` (ver sección de instalación).

---

## 🚀 Tecnologías utilizadas

| Categoría | Tecnología |
|---|---|
| Backend | Node.js, Express.js |
| Base de datos | MongoDB + Mongoose |
| Motor de plantillas | Handlebars (`express-handlebars`) |
| Autenticación | Sesiones (`express-session`) + bcrypt |
| Validaciones | `express-validator` |
| Carga de archivos | Multer |
| Envío de correos | Resend (API HTTP) |
| Estilos | Bootstrap 5 + CSS personalizado |
| Variables de entorno | `dotenv` + `cross-env` |
| Deploy | Railway |

---

## 🏗️ Arquitectura (MVC)

```
AppCenar/
├── config/          # Conexión a BD, Multer, correo
├── models/          # Esquemas de Mongoose (Modelo)
├── views/           # Plantillas Handlebars (Vista)
├── controllers/      # Lógica de negocio (Controlador)
├── routes/          # Definición de endpoints por rol
├── middlewares/      # Autenticación, autorización, tokens
├── public/          # CSS, imágenes, archivos subidos
└── app.js           # Punto de entrada
```

---

## 👥 Roles del sistema

- **Cliente** — explora comercios por tipo, arma su pedido, gestiona direcciones y favoritos.
- **Comercio** — administra su catálogo (categorías/productos) y gestiona los pedidos recibidos.
- **Delivery** — recibe pedidos asignados y los marca como completados.
- **Administrador** — gestiona usuarios, tipos de comercio, configuración del sistema (ITBIS) y otros administradores.

---

## ⚙️ Instalación local

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/appcenar.git
cd appcenar
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz:

```dotenv
PORT=8080
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/appcenar_dev
SESSION_SECRET=tu_secreto_aqui
BASE_URL=http://localhost:8080

RESEND_API_KEY=re_tu_api_key
```

### 4. Levantar MongoDB

Usa MongoDB local o [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). Ajusta `MONGO_URI` según corresponda.

### 5. Crear el administrador por defecto

```bash
node crear-admin.js
```

### 6. (Opcional) Poblar la base con datos de prueba

```bash
node seed.js
```

Esto crea tipos de comercio, comercios con catálogo, clientes, direcciones y delivery de ejemplo.

### 7. Correr el proyecto

```bash
npm run dev
```

Abre `http://localhost:8080` en el navegador.

---

## 📋 Funcionalidades principales

### Cliente
- Registro y activación de cuenta por correo
- Exploración de comercios por tipo, con buscador
- Catálogo de productos por categoría con carrito
- Selección de dirección y cálculo automático de ITBIS
- Historial de pedidos con detalle
- Gestión de direcciones (CRUD)
- Comercios favoritos

### Comercio
- Gestión de pedidos recibidos (asignar delivery)
- Mantenimiento de categorías (CRUD)
- Mantenimiento de productos (CRUD)
- Edición de perfil del negocio

### Delivery
- Listado de pedidos asignados
- Completar entregas (con dirección visible solo mientras está en proceso)

### Administrador
- Dashboard con indicadores en tiempo real
- Gestión de clientes, comercios y delivery (activar/inactivar)
- Mantenimiento de tipos de comercio (con eliminación en cascada)
- Configuración del ITBIS
- Gestión de otros administradores

---

## 🔒 Seguridad

- Contraseñas hasheadas con `bcrypt`
- Middleware de sesión que protege todas las rutas privadas por rol
- Validación de datos en el servidor con `express-validator`, además de en el cliente
- Tokens de un solo uso para activación de cuenta y recuperación de contraseña (con expiración)
- Un administrador no puede editarse ni inactivarse a sí mismo

---

## ⚠️ Limitaciones conocidas

- **Archivos subidos (Multer):** Railway usa almacenamiento efímero, por lo que las imágenes subidas se pierden en cada redeploy. Para producción robusta se recomendaría integrar un servicio como Cloudinary.
- **Envío de correos (Resend):** mientras no se verifique un dominio propio, el plan gratuito de Resend solo permite enviar correos a la dirección registrada en la cuenta.

---

## 👨‍💻 Autor

- Lismel Gómez - SoyyMely

Proyecto final — ITLA, 2026
