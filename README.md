# 🚗 ZavalaTech Parking - Sistema de Gestión de Estacionamiento

Sistema web de gestión de estacionamiento desarrollado con **Angular 20** y **Firebase**, que permite administrar vehículos, espacios de estacionamiento y usuarios con diferentes roles (Administrador y Guardia).

---

## 📋 Descripción del Proyecto

**ZavalaTech Parking** es una aplicación web moderna para la gestión integral de estacionamientos. Ofrece funcionalidades de registro de entrada/salida de vehículos, visualización de espacios disponibles en tiempo real, historial de operaciones y estadísticas para administradores.

### Características Principales
- ✅ Registro de entrada y salida de vehículos
- ✅ Visualización en tiempo real de espacios disponibles
- ✅ Sistema de autenticación con Firebase Auth
- ✅ Control de acceso basado en roles (Admin / Guardia)
- ✅ Historial de vehículos y estadísticas
- ✅ Diseño responsive y moderno
- ✅ Persistencia de datos en Firestore

---

## 🛠️ Tecnologías y Herramientas Utilizadas

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| **Framework** | Angular | 20.3.0 |
| **Lenguaje** | TypeScript | 5.9.2 |
| **Base de Datos** | Firebase Firestore | 11.10.0 |
| **Autenticación** | Firebase Auth | 11.10.0 |
| **Hosting** | Firebase Hosting | - |
| **Librería Firebase** | @angular/fire | 20.0.1 |
| **Gestión de Estado** | RxJS | 7.8.0 |
| **Testing** | Jasmine + Karma | 5.9.0 / 6.4.0 |

---

## 📦 Requisitos e Instalación

### Prerrequisitos
- **Node.js** v18.x o superior
- **npm** v9.x o superior
- **Angular CLI** v20.x

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/estacionamiento-angular.git

# 2. Navegar al directorio del proyecto
cd estacionamiento-angular

# 3. Instalar dependencias
npm install

# 4. Iniciar el servidor de desarrollo
npm start
```

La aplicación estará disponible en `http://localhost:4200`

### Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor de desarrollo |
| `npm run build` | Genera el build de producción |
| `npm test` | Ejecuta las pruebas unitarias |
| `npm run watch` | Build en modo desarrollo con hot reload |

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Carpetas

```
src/app/
├── compartido/              # Recursos compartidos
│   ├── componentes/         # Header, Footer, Modal
│   ├── modelos/             # Interfaces TypeScript
│   ├── pipes/               # Pipes personalizados
│   └── servicios/           # Servicios de datos
│
├── nucleo/                  # Lógica central
│   └── guardias/            # Guards de ruta
│
└── pages/                   # Páginas/Componentes de vista
    ├── inicio/              # Página principal
    ├── login/               # Autenticación
    ├── vehiculos/           # Gestión de vehículos
    ├── buscar/              # Búsqueda rápida
    ├── historial/           # Historial (Admin)
    └── estadisticas/        # Estadísticas (Admin)
```

### Componentes Principales

| Componente | Descripción |
|------------|-------------|
| `InicioComponent` | Página principal con estado del estacionamiento |
| `LoginComponent` | Formulario de autenticación |
| `VehiculosComponent` | Registro de entrada/salida de vehículos |
| `BuscarComponent` | Búsqueda rápida por placa (Guardia) |
| `HistorialComponent` | Historial completo de vehículos (Admin) |
| `EstadisticasComponent` | Dashboard con métricas (Admin) |

### Servicios

| Servicio | Responsabilidad |
|----------|-----------------|
| `AutenticacionServicio` | Manejo de login, logout y estado de usuario |
| `VehiculosServicio` | CRUD de vehículos en Firestore |
| `EspaciosServicio` | Gestión de espacios de estacionamiento |

### Guards de Ruta

| Guard | Función |
|-------|---------|
| `authGuard` | Verifica autenticación general |
| `guardiaGuard` | Acceso exclusivo para rol Guardia |
| `adminGuard` | Acceso exclusivo para rol Administrador |

### Flujo de Autenticación

```
Usuario → Login → Firebase Auth → Obtener Rol desde Firestore → Redirigir según Rol
                                                    ↓
                               Administrador: /vehiculos, /historial, /estadisticas
                               Guardia: /vehiculos, /buscar
                               Público: /inicio, /login
```

---

## 🌐 Deploy en Firebase Hosting

https://controldeestacionamiento.web.app 

### URL de la Aplicación Desplegada

🔗 ****

https://controldeestacionamiento.web.app/
---

## 🎥 Video Demostrativo

### Video de Presentación (5-8 minutos)

📹 **[Ver Video en YouTube]  ()**

El video incluye:
- ✅ Demostración de funcionalidades principales
- ✅ Flujo completo de autenticación
- ✅ Registro y lectura de datos en Firestore
- ✅ Explicación del código (componentes, servicios y guards)

---

## 📖 Manual de Usuario

### 1. Acceso a la Aplicación
- Ingresa a la URL del proyecto
- La página de inicio muestra el estado actual del estacionamiento

### 2. Inicio de Sesión
- Haz clic en "Iniciar Sesión" en el header
- Ingresa tu email y contraseña registrados
- El sistema te redirigirá según tu rol

### 3. Gestión de Vehículos (Guardia/Admin)
- **Registrar Entrada**: Completa el formulario con placa, propietario y tipo de vehículo
- **Registrar Salida**: Busca el vehículo y haz clic en "Registrar Salida"

### 4. Búsqueda Rápida (Guardia)
- Ingresa la placa del vehículo
- El sistema mostrará la información del vehículo activo

### 5. Historial y Estadísticas (Admin)
- **Historial**: Visualiza todos los registros de vehículos
- **Estadísticas**: Consulta métricas de ocupación y uso

### Roles y Permisos

| Funcionalidad | Público | Guardia | Admin |
|---------------|---------|---------|-------|
| Ver inicio | ✅ | ✅ | ✅ |
| Login | ✅ | ✅ | ✅ |
| Gestión vehículos | ❌ | ✅ | ✅ |
| Búsqueda rápida | ❌ | ✅ | ❌ |
| Historial | ❌ | ❌ | ✅ |
| Estadísticas | ❌ | ❌ | ✅ |

---

## 👨‍💻 Autor

**Danny Huaman Zavala**