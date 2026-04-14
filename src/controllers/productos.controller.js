import { pool } from '../config/database.js';

// GET - Listar todos los productos
export const getProductos = async (req, res) => {
    try {
        const [rows] = await pool.query('CALL sp_listar_productos()');
        res.json({ ok: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: 'Error al listar productos', error: error.message });
    }
};

// GET/:id - Obtener producto por ID
export const getProductoById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('CALL sp_obtener_producto(?)', [id]);
        if (rows[0].length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
        }
        res.json({ ok: true, data: rows[0][0] });
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: 'Error al obtener producto', error: error.message });
    }
};

// POST - Crear producto
export const createProducto = async (req, res) => {
    const { nombre, precio, stock, id_categoria } = req.body;

    // Validaciones
    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ ok: false, mensaje: 'El nombre del producto es obligatorio' });
    }
    if (!precio || precio <= 0) {
        return res.status(400).json({ ok: false, mensaje: 'El precio debe ser mayor a 0' });
    }
    if (stock === undefined || stock === null || stock < 0) {
        return res.status(400).json({ ok: false, mensaje: 'El stock debe ser mayor o igual a 0' });
    }
    if (!id_categoria) {
        return res.status(400).json({ ok: false, mensaje: 'La categoría es obligatoria' });
    }

    try {
        // Verificar que la categoría existe
        const [cat] = await pool.query('SELECT id FROM categorias WHERE id = ?', [id_categoria]);
        if (cat.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Categoría no encontrada' });
        }

        const [rows] = await pool.query('CALL sp_insertar_producto(?, ?, ?, ?)', [nombre, precio, stock, id_categoria]);
        const nuevoId = rows[0][0].id;
        res.status(201).json({ ok: true, mensaje: 'Producto creado', id: nuevoId });
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: 'Error al crear producto', error: error.message });
    }
};

// PUT - Actualizar producto
export const updateProducto = async (req, res) => {
    const { id } = req.params;
    const { nombre, precio, stock, id_categoria } = req.body;

    // Validaciones
    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ ok: false, mensaje: 'El nombre del producto es obligatorio' });
    }
    if (!precio || precio <= 0) {
        return res.status(400).json({ ok: false, mensaje: 'El precio debe ser mayor a 0' });
    }
    if (stock === undefined || stock === null || stock < 0) {
        return res.status(400).json({ ok: false, mensaje: 'El stock debe ser mayor o igual a 0' });
    }

    try {
        // Verificar que el producto existe
        const [existe] = await pool.query('SELECT id FROM productos WHERE id = ?', [id]);
        if (existe.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
        }

        // Verificar que la categoría existe
        const [cat] = await pool.query('SELECT id FROM categorias WHERE id = ?', [id_categoria]);
        if (cat.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Categoría no encontrada' });
        }

        await pool.query('CALL sp_actualizar_producto(?, ?, ?, ?, ?)', [id, nombre, precio, stock, id_categoria]);
        res.json({ ok: true, mensaje: 'Producto actualizado' });
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar producto', error: error.message });
    }
};

// DELETE - Eliminar producto
export const deleteProducto = async (req, res) => {
    const { id } = req.params;
    try {
        const [existe] = await pool.query('SELECT id FROM productos WHERE id = ?', [id]);
        if (existe.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
        }

        await pool.query('CALL sp_eliminar_producto(?)', [id]);
        res.json({ ok: true, mensaje: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: 'Error al eliminar producto', error: error.message });
    }
};