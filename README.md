# 📦 Inventario API

REST API para gestión de productos e inventario con Node.js, Express y MySQL. Implementa operaciones CRUD completas mediante procedimientos almacenados, validaciones de negocio y manejo estructurado de errores.

---

## Tabla de Contenidos

- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Configuración e Instalación](#configuración-e-instalación)
- [Base de Datos](#base-de-datos)
- [Procedimientos Almacenados](#procedimientos-almacenados)
- [Endpoints de la API](#endpoints-de-la-api)
- [Validaciones y Manejo de Errores](#validaciones-y-manejo-de-errores)
- [Pruebas con Postman](#pruebas-con-postman)
- [Códigos de Respuesta HTTP](#códigos-de-respuesta-http)

---

## Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | 18.20.4 | Runtime |
| Express | 5.2.1 | Framework HTTP |
| mysql2 | 3.22.0 | Driver MySQL con soporte a Promises |
| XAMPP | 8.x | Servidor local MySQL |

---

## Arquitectura del Proyecto

```
inventario-api/
├── src/
│   ├── config/
│   │   └── database.js           # Pool de conexiones MySQL
│   ├── controllers/
│   │   ├── categorias.controller.js   # Lógica de negocio - Categorías
│   │   └── productos.controller.js    # Lógica de negocio - Productos
│   ├── routes/
│   │   ├── categorias.routes.js       # Definición de rutas - Categorías
│   │   └── productos.routes.js        # Definición de rutas - Productos
│   └── app.js                    # Entry point, configuración Express
└── package.json
```

**Flujo de una request:**

```
Cliente (Postman)
    │
    ▼
app.js  →  routes/*.routes.js  →  controllers/*.controller.js
                                          │
                                          ▼
                                  config/database.js
                                          │
                                          ▼
                               MySQL  →  CALL sp_...()
                                          │
                                          ▼
                                    JSON Response
```

---

## Requisitos Previos

- Node.js 18 o superior
- XAMPP con MySQL activo
- Postman (para pruebas)

---

## Configuración e Instalación

### 1. Clonar / crear el proyecto

```bash
mkdir inventario-api
cd inventario-api
npm init -y
npm install express mysql2
```

### 2. Habilitar ES Modules

Agregar en `package.json`:

```json
{
  "name": "lab05-inventario-api",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "dev": "nodemon src/app.js"
  },
  "type": "module",
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

### 3. Iniciar XAMPP

Activar los módulos **Apache** y **MySQL** desde el panel de XAMPP.

### 4. Levantar el servidor

```bash
npm run dev
```

Salida esperada:

```
Servidor corriendo en http://localhost:3000
```

---

## Base de Datos

### Crear la base de datos y tablas

Ejecutar en **phpMyAdmin** o la consola de MySQL:

```sql
CREATE DATABASE IF NOT EXISTS bd_inventario;
USE bd_inventario;

CREATE TABLE categorias (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE productos (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(150) NOT NULL,
    precio       DECIMAL(10,2) NOT NULL,
    stock        INT NOT NULL DEFAULT 0,
    id_categoria INT NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id)
);
```

### Diagrama de relación

```
categorias                productos
──────────────────        ──────────────────────
id         PK INT    ◄──  id_categoria  FK INT
nombre     VARCHAR        id            PK INT
descripcion TEXT          nombre        VARCHAR
created_at TIMESTAMP      precio        DECIMAL
                          stock         INT
                          created_at    TIMESTAMP
```

---

## Procedimientos Almacenados

Todos los accesos a la base de datos se realizan **exclusivamente** mediante stored procedures. Ningún controlador ejecuta SQL directamente sobre las tablas.

### Creación de los SPs

```sql
DELIMITER $$

-- ─────────────────────────────
-- CATEGORÍAS
-- ─────────────────────────────

CREATE PROCEDURE sp_listar_categorias()
BEGIN
    SELECT * FROM categorias;
END$$

CREATE PROCEDURE sp_insertar_categoria(
    IN p_nombre      VARCHAR(100),
    IN p_descripcion TEXT
)
BEGIN
    INSERT INTO categorias (nombre, descripcion)
    VALUES (p_nombre, p_descripcion);
    SELECT LAST_INSERT_ID() AS id;
END$$

CREATE PROCEDURE sp_actualizar_categoria(
    IN p_id          INT,
    IN p_nombre      VARCHAR(100),
    IN p_descripcion TEXT
)
BEGIN
    UPDATE categorias
    SET nombre = p_nombre, descripcion = p_descripcion
    WHERE id = p_id;
END$$

CREATE PROCEDURE sp_eliminar_categoria(IN p_id INT)
BEGIN
    DELETE FROM categorias WHERE id = p_id;
END$$

-- ─────────────────────────────
-- PRODUCTOS
-- ─────────────────────────────

CREATE PROCEDURE sp_listar_productos()
BEGIN
    SELECT p.*, c.nombre AS categoria_nombre
    FROM productos p
    INNER JOIN categorias c ON p.id_categoria = c.id;
END$$

CREATE PROCEDURE sp_obtener_producto(IN p_id INT)
BEGIN
    SELECT p.*, c.nombre AS categoria_nombre
    FROM productos p
    INNER JOIN categorias c ON p.id_categoria = c.id
    WHERE p.id = p_id;
END$$

CREATE PROCEDURE sp_insertar_producto(
    IN p_nombre       VARCHAR(150),
    IN p_precio       DECIMAL(10,2),
    IN p_stock        INT,
    IN p_id_categoria INT
)
BEGIN
    INSERT INTO productos (nombre, precio, stock, id_categoria)
    VALUES (p_nombre, p_precio, p_stock, p_id_categoria);
    SELECT LAST_INSERT_ID() AS id;
END$$

CREATE PROCEDURE sp_actualizar_producto(
    IN p_id           INT,
    IN p_nombre       VARCHAR(150),
    IN p_precio       DECIMAL(10,2),
    IN p_stock        INT,
    IN p_id_categoria INT
)
BEGIN
    UPDATE productos
    SET nombre = p_nombre, precio = p_precio,
        stock = p_stock, id_categoria = p_id_categoria
    WHERE id = p_id;
END$$

CREATE PROCEDURE sp_eliminar_producto(IN p_id INT)
BEGIN
    DELETE FROM productos WHERE id = p_id;
END$$

DELIMITER ;
```

### Mapa Endpoint → Stored Procedure

| Método | Endpoint | Stored Procedure |
|---|---|---|
| GET | `/api/categorias` | `CALL sp_listar_categorias()` |
| POST | `/api/categorias` | `CALL sp_insertar_categoria(?, ?)` |
| PUT | `/api/categorias/:id` | `CALL sp_actualizar_categoria(?, ?, ?)` |
| DELETE | `/api/categorias/:id` | `CALL sp_eliminar_categoria(?)` |
| GET | `/api/productos` | `CALL sp_listar_productos()` |
| GET | `/api/productos/:id` | `CALL sp_obtener_producto(?)` |
| POST | `/api/productos` | `CALL sp_insertar_producto(?, ?, ?, ?)` |
| PUT | `/api/productos/:id` | `CALL sp_actualizar_producto(?, ?, ?, ?, ?)` |
| DELETE | `/api/productos/:id` | `CALL sp_eliminar_producto(?)` |

---

## Endpoints de la API

Base URL: `http://localhost:3000`

### Categorías

#### `GET /api/categorias`
Lista todas las categorías.

**Response `200`:**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "nombre": "Electrónica",
      "descripcion": "Gadgets y dispositivos",
      "created_at": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### `POST /api/categorias`
Crea una nueva categoría.

**Body:**
```json
{
  "nombre": "Electrónica",
  "descripcion": "Gadgets y dispositivos"
}
```

**Response `201`:**
```json
{
  "ok": true,
  "mensaje": "Categoría creada",
  "id": 1
}
```

---

#### `PUT /api/categorias/:id`
Actualiza una categoría existente.

**Body:**
```json
{
  "nombre": "Electrónica y Tecnología",
  "descripcion": "Descripción actualizada"
}
```

**Response `200`:**
```json
{
  "ok": true,
  "mensaje": "Categoría actualizada"
}
```

---

#### `DELETE /api/categorias/:id`
Elimina una categoría. Falla si tiene productos asociados.

**Response `200`:**
```json
{
  "ok": true,
  "mensaje": "Categoría eliminada"
}
```

---

### Productos

#### `GET /api/productos`
Lista todos los productos con el nombre de su categoría.

**Response `200`:**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "nombre": "Laptop HP",
      "precio": "2500.00",
      "stock": 10,
      "id_categoria": 1,
      "categoria_nombre": "Electrónica",
      "created_at": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### `GET /api/productos/:id`
Obtiene un producto específico por ID.

**Response `200`:**
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "nombre": "Laptop HP",
    "precio": "2500.00",
    "stock": 10,
    "id_categoria": 1,
    "categoria_nombre": "Electrónica"
  }
}
```

---

#### `POST /api/productos`
Crea un nuevo producto.

**Body:**
```json
{
  "nombre": "Laptop HP",
  "precio": 2500.00,
  "stock": 10,
  "id_categoria": 1
}
```

**Response `201`:**
```json
{
  "ok": true,
  "mensaje": "Producto creado",
  "id": 1
}
```

---

#### `PUT /api/productos/:id`
Actualiza un producto existente.

**Body:**
```json
{
  "nombre": "Laptop HP Pavilion",
  "precio": 2800.00,
  "stock": 8,
  "id_categoria": 1
}
```

**Response `200`:**
```json
{
  "ok": true,
  "mensaje": "Producto actualizado"
}
```

---

#### `DELETE /api/productos/:id`
Elimina un producto por ID.

**Response `200`:**
```json
{
  "ok": true,
  "mensaje": "Producto eliminado"
}
```

---

## Validaciones y Manejo de Errores

### Reglas de negocio aplicadas en controladores

| Campo | Regla | Error si falla |
|---|---|---|
| `nombre` (producto) | Obligatorio, no vacío | `400` |
| `precio` | Requerido y mayor a `0` | `400` |
| `stock` | Mayor o igual a `0` | `400` |
| `id_categoria` | Debe existir en la tabla `categorias` | `404` |
| `nombre` (categoría) | Obligatorio, no vacío | `400` |

### Errores de integridad referencial

| Situación | Código | Mensaje |
|---|---|---|
| Categoría no encontrada (PUT/DELETE) | `404` | `"Categoría no encontrada"` |
| Producto no encontrado (GET/PUT/DELETE) | `404` | `"Producto no encontrado"` |
| Eliminar categoría con productos asociados | `400` | `"No se puede eliminar: la categoría tiene productos asociados"` |
| Error interno del servidor | `500` | `"Error al ... "` + `error.message` |

### Formato estándar de error

```json
{
  "ok": false,
  "mensaje": "Descripción del error",
  "error": "Detalle técnico (solo en errores 500)"
}
```

---

## Pruebas con Postman

> Configuración base: `Content-Type: application/json` en todas las requests con body.  
> Orden recomendado: ejecutar los casos de categorías primero, luego los de productos.

### Categorías

#### Caso 1 — Listar categorías (estado inicial)
```
GET http://localhost:3000/api/categorias
```
Resultado esperado: `200` → `{ "ok": true, "data": [] }`

---

#### Caso 2 — Crear categoría (exitoso)
```
POST http://localhost:3000/api/categorias
```
```json
{
  "nombre": "Electrónica",
  "descripcion": "Productos electrónicos y tecnología"
}
```
Resultado esperado: `201` → `{ "ok": true, "mensaje": "Categoría creada", "id": 1 }`

---

#### Caso 3 — Crear segunda categoría (para prueba de DELETE)
```
POST http://localhost:3000/api/categorias
```
```json
{
  "nombre": "Ropa",
  "descripcion": "Prendas de vestir"
}
```
Resultado esperado: `201` → `{ "ok": true, "mensaje": "Categoría creada", "id": 2 }`

---

#### Caso 4 — Crear categoría sin nombre (validación)
```
POST http://localhost:3000/api/categorias
```
```json
{
  "descripcion": "Sin nombre"
}
```
Resultado esperado: `400` → `{ "ok": false, "mensaje": "El nombre de la categoría es obligatorio" }`

---

#### Caso 5 — Actualizar categoría (exitoso)
```
PUT http://localhost:3000/api/categorias/1
```
```json
{
  "nombre": "Electrónica y Tecnología",
  "descripcion": "Gadgets y dispositivos actualizados"
}
```
Resultado esperado: `200` → `{ "ok": true, "mensaje": "Categoría actualizada" }`

---

#### Caso 6 — Actualizar categoría inexistente
```
PUT http://localhost:3000/api/categorias/999
```
```json
{
  "nombre": "Test"
}
```
Resultado esperado: `404` → `{ "ok": false, "mensaje": "Categoría no encontrada" }`

---

#### Caso 7 — Eliminar categoría sin productos (exitoso)
```
DELETE http://localhost:3000/api/categorias/2
```
Resultado esperado: `200` → `{ "ok": true, "mensaje": "Categoría eliminada" }`

---

### Productos

> ⚠️ Prerequisito: debe existir al menos la categoría con `id: 1`.

#### Caso 8 — Crear producto (exitoso)
```
POST http://localhost:3000/api/productos
```
```json
{
  "nombre": "Laptop HP",
  "precio": 2500.00,
  "stock": 10,
  "id_categoria": 1
}
```
Resultado esperado: `201` → `{ "ok": true, "mensaje": "Producto creado", "id": 1 }`

---

#### Caso 9 — Crear producto con precio inválido
```
POST http://localhost:3000/api/productos
```
```json
{
  "nombre": "Mouse",
  "precio": -50,
  "stock": 5,
  "id_categoria": 1
}
```
Resultado esperado: `400` → `{ "ok": false, "mensaje": "El precio debe ser mayor a 0" }`

---

#### Caso 10 — Crear producto con stock negativo
```
POST http://localhost:3000/api/productos
```
```json
{
  "nombre": "Teclado",
  "precio": 150,
  "stock": -3,
  "id_categoria": 1
}
```
Resultado esperado: `400` → `{ "ok": false, "mensaje": "El stock debe ser mayor o igual a 0" }`

---

#### Caso 11 — Crear producto con categoría inexistente
```
POST http://localhost:3000/api/productos
```
```json
{
  "nombre": "Monitor",
  "precio": 800,
  "stock": 5,
  "id_categoria": 999
}
```
Resultado esperado: `404` → `{ "ok": false, "mensaje": "Categoría no encontrada" }`

---

#### Caso 12 — Crear producto sin nombre
```
POST http://localhost:3000/api/productos
```
```json
{
  "precio": 100,
  "stock": 5,
  "id_categoria": 1
}
```
Resultado esperado: `400` → `{ "ok": false, "mensaje": "El nombre del producto es obligatorio" }`

---

#### Caso 13 — Listar todos los productos
```
GET http://localhost:3000/api/productos
```
Resultado esperado: `200` → lista con `categoria_nombre` incluido en cada objeto

---

#### Caso 14 — Obtener producto por ID (exitoso)
```
GET http://localhost:3000/api/productos/1
```
Resultado esperado: `200` → objeto del producto con `categoria_nombre`

---

#### Caso 15 — Obtener producto inexistente
```
GET http://localhost:3000/api/productos/999
```
Resultado esperado: `404` → `{ "ok": false, "mensaje": "Producto no encontrado" }`

---

#### Caso 16 — Actualizar producto (exitoso)
```
PUT http://localhost:3000/api/productos/1
```
```json
{
  "nombre": "Laptop HP Pavilion",
  "precio": 2800.00,
  "stock": 8,
  "id_categoria": 1
}
```
Resultado esperado: `200` → `{ "ok": true, "mensaje": "Producto actualizado" }`

---

#### Caso 17 — Eliminar categoría con productos asociados (error controlado)
```
DELETE http://localhost:3000/api/categorias/1
```
Resultado esperado: `400` → `{ "ok": false, "mensaje": "No se puede eliminar: la categoría tiene productos asociados" }`

---

#### Caso 18 — Eliminar producto (exitoso)
```
DELETE http://localhost:3000/api/productos/1
```
Resultado esperado: `200` → `{ "ok": true, "mensaje": "Producto eliminado" }`

---

#### Caso 19 — Eliminar producto inexistente
```
DELETE http://localhost:3000/api/productos/999
```
Resultado esperado: `404` → `{ "ok": false, "mensaje": "Producto no encontrado" }`

---

## Códigos de Respuesta HTTP

| Código | Significado | Cuándo se usa |
|---|---|---|
| `200` | OK | Operación exitosa (GET, PUT, DELETE) |
| `201` | Created | Recurso creado exitosamente (POST) |
| `400` | Bad Request | Validación fallida o restricción de negocio |
| `404` | Not Found | Recurso no encontrado en base de datos |
| `500` | Internal Server Error | Error inesperado del servidor o base de datos |
