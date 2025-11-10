# 🎯 Backend Rifa Siera Code - Express.js

Backend completo con autenticación propia (JWT) + Supabase para la rifa.

## 🚀 Stack Tecnológico

- **Express.js** - Framework web
- **JWT** - Autenticación con tokens
- **bcryptjs** - Hash de contraseñas
- **Supabase** - Base de datos PostgreSQL + Storage
- **Multer** - Subida de archivos
- **express-validator** - Validación de datos

---

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── supabase.js          # Configuración de Supabase
│   ├── controllers/
│   │   ├── auth.controller.js   # Lógica de autenticación
│   │   └── boleto.controller.js # Lógica de boletos
│   ├── middlewares/
│   │   ├── auth.middleware.js   # Verificación de JWT
│   │   └── errorHandler.js      # Manejo de errores
│   ├── routes/
│   │   ├── auth.routes.js       # Rutas de autenticación
│   │   └── boleto.routes.js     # Rutas de boletos
│   └── server.js                # Servidor principal
├── .env                         # Variables de entorno
├── package.json
└── schema_con_usuarios.sql      # Schema actualizado con tabla usuarios
```

---

## ⚙️ Instalación

### 1. Instalar dependencias
\`\`\`bash
cd backend
npm install
\`\`\`

### 2. Configurar variables de entorno
El archivo \`.env\` ya está configurado con:
- Puerto del servidor: 5000
- Credenciales de Supabase
- JWT_SECRET para tokens

**⚠️ IMPORTANTE:** Cambia el \`JWT_SECRET\` en producción.

### 3. Actualizar schema de Supabase
Ve a tu proyecto de Supabase → SQL Editor y ejecuta:
\`\`\`sql
-- Contenido de schema_con_usuarios.sql
\`\`\`

Esto creará la tabla \`usuarios\` para la autenticación propia.

### 4. Iniciar servidor
\`\`\`bash
npm run dev
\`\`\`

El servidor correrá en: **http://localhost:5000**

---

## 🔐 API de Autenticación

### 1️⃣ Registro
**POST** \`/api/auth/register\`

Body:
\`\`\`json
{
  "email": "juan@example.com",
  "password": "123456",
  "nombre": "Juan Pérez"
}
\`\`\`

Respuesta:
\`\`\`json
{
  "message": "Usuario registrado. Por favor verifica tu correo electrónico.",
  "verificationUrl": "http://localhost:3000/auth/verify?token=..."
}
\`\`\`

### 2️⃣ Login
**POST** \`/api/auth/login\`

Body:
\`\`\`json
{
  "email": "juan@example.com",
  "password": "123456"
}
\`\`\`

Respuesta:
\`\`\`json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "juan@example.com",
    "nombre": "Juan Pérez",
    "email_verificado": false
  }
}
\`\`\`

**💡 Importante:** Guarda el \`token\` para usarlo en las siguientes peticiones.

### 3️⃣ Verificar Email
**GET** \`/api/auth/verify/:token\`

Ejemplo: \`GET /api/auth/verify/abc-123-def\`

### 4️⃣ Reenviar Verificación
**POST** \`/api/auth/resend-verification\`

Body:
\`\`\`json
{
  "email": "juan@example.com"
}
\`\`\`

### 5️⃣ Obtener Perfil (Protegido)
**GET** \`/api/auth/profile\`

Headers:
\`\`\`
Authorization: Bearer <tu_token_jwt>
\`\`\`

---

## 🎟️ API de Boletos

### 1️⃣ Registrar Boleto (Protegido + Email Verificado)
**POST** \`/api/boletos/registrar\`

Headers:
\`\`\`
Authorization: Bearer <tu_token_jwt>
Content-Type: multipart/form-data
\`\`\`

Form Data:
\`\`\`
nombre: Juan Pérez
telefono: 2711234567
tipo_participante: Público General  // o "Estudiante TecNM"
sede: Zongolica  // Solo si es Estudiante TecNM
numeros_boleto: ["001", "002", "003"]  // Array de strings
comprobante: [archivo]  // Imagen o PDF
\`\`\`

### 2️⃣ Obtener Mis Boletos (Protegido)
**GET** \`/api/boletos/mis-boletos\`

Headers:
\`\`\`
Authorization: Bearer <tu_token_jwt>
\`\`\`

### 3️⃣ Obtener Catálogo (Público)
**GET** \`/api/boletos/catalogo\`

### 4️⃣ Obtener Transparencia (Público)
**GET** \`/api/boletos/transparencia\`

---

## 🔒 Sistema de Autenticación

### Flujo Completo:

1. **Usuario se registra** → Se crea en tabla \`usuarios\` con \`email_verificado: false\`
2. **Se genera token de verificación** → Se guarda en \`verification_token\`
3. **Usuario recibe email** (por ahora solo se muestra en consola)
4. **Usuario hace clic en link** → \`GET /api/auth/verify/:token\`
5. **Email verificado** → \`email_verificado: true\`
6. **Usuario hace login** → Recibe JWT que expira en 7 días
7. **Usuario usa JWT** → En header \`Authorization: Bearer <token>\`

### Middlewares:
- **verifyToken**: Valida que el JWT sea válido y el usuario exista
- **verifyEmailVerified**: Valida que el email esté verificado

### Seguridad:
- Contraseñas hasheadas con bcrypt (10 rounds)
- JWT con secret configurable
- RLS (Row Level Security) en Supabase
- Validación de inputs con express-validator

---

## 📊 Base de Datos

### Nueva Tabla: usuarios

\`\`\`sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nombre TEXT NOT NULL,
  email_verificado BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### Tablas Existentes:
- \`boletos_catalogo\` - 150 boletos del 001 al 150
- \`boletos\` - Boletos comprados por usuarios
- \`reservas_boletos\` - Reservas temporales (30 min)

---

## 🧪 Prueba Rápida

### 1. Verificar que el servidor esté corriendo:
\`\`\`bash
curl http://localhost:5000/api/health
\`\`\`

### 2. Registrar un usuario:
\`\`\`bash
curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "nombre": "Usuario Test"
  }'
\`\`\`

### 3. Ver el link de verificación en la consola del servidor

### 4. Hacer login:
\`\`\`bash
curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'
\`\`\`

### 5. Guardar el token y obtener perfil:
\`\`\`bash
curl http://localhost:5000/api/auth/profile \\
  -H "Authorization: Bearer <tu_token_aqui>"
\`\`\`

---

## 📝 Próximos Pasos

### Backend:
- [ ] Implementar envío de emails (usar nodemailer + SendGrid/Resend)
- [ ] Agregar Google OAuth
- [ ] Agregar refresh tokens
- [ ] Rate limiting para prevenir spam
- [ ] Logger (Winston/Pino)
- [ ] Tests (Jest/Supertest)

### Frontend:
- [ ] Integrar con el nuevo backend
- [ ] Actualizar formularios para usar las nuevas APIs
- [ ] Almacenar JWT en localStorage/cookies
- [ ] Interceptor de Axios para agregar token automáticamente
- [ ] Manejo de errores 401 (logout automático)

---

## 🐛 Debugging

### El servidor no arranca:
- Verifica que el puerto 5000 no esté ocupado
- Revisa las variables de entorno en \`.env\`
- Verifica las credenciales de Supabase

### Error 401 Unauthorized:
- Verifica que estés enviando el token en el header
- Formato correcto: \`Authorization: Bearer <token>\`
- Verifica que el token no haya expirado

### Error al subir comprobante:
- Verifica que el bucket \`rifa-siera\` exista en Supabase Storage
- Verifica que sea público
- Tamaño máximo: 5MB

---

## 🎉 ¡Backend Listo!

Ahora tienes:
✅ Autenticación propia con JWT
✅ Registro y login de usuarios
✅ Verificación de email
✅ Protección de rutas con middleware
✅ Sistema completo de boletos
✅ Integración con Supabase

**Siguiente paso:** Integrar el frontend con estas APIs nuevas.
