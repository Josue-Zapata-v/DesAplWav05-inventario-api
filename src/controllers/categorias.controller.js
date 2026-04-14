import { pool } from '../config/database.js';

// GET - Listar todas las categorías
export const getCategorias = async (req, res) => {
    try {
        const [rows] = await pool.query('CALL sp_listar_categorias()');
        res.json({ ok: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: 'Error al listar categorías', error: error.message });
    }
};

// POST - Crear categoría
export const createCategoria = async (req, res) => {
    const { nombre, descripcion } = req.body;

    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ ok: false, mensaje: 'El nombre de la categoría es obligatorio' });
    }

    try {
        const [rows] = await pool.query('CALL sp_insertar_categoria(?, ?)', [nombre, descripcion || null]);
        const nuevoId = rows[0][0].id;
        res.status(201).json({ ok: true, mensaje: 'Categoría creada', id: nuevoId });
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: 'Error al crear categoría', error: error.message });
    }
};

// PUT - Actualizar categoría
export const updateCategoria = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ ok: false, mensaje: 'El nombre de la categoría es obligatorio' });
    }

    try {
        // Verificar que existe
        const [existe] = await pool.query('SELECT id FROM categorias WHERE id = ?', [id]);
        if (existe.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Categoría no encontrada' });
        }

        await pool.query('CALL sp_actualizar_categoria(?, ?, ?)', [id, nombre, descripcion || null]);
        res.json({ ok: true, mensaje: 'Categoría actualizada' });
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar categoría', error: error.message });
    }
};

// DELETE - Eliminar categoría
export const deleteCategoria = async (req, res) => {
    const { id } = req.params;

    try {
        // Verificar que existe
        const [existe] = await pool.query('SELECT id FROM categorias WHERE id = ?', [id]);
        if (existe.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Categoría no encontrada' });
        }

        // Verificar que no tenga productos asociados
        const [productos] = await pool.query('SELECT id FROM productos WHERE id_categoria = ?', [id]);
        if (productos.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'No se puede eliminar: la categoría tiene productos asociados' });
        }

        await pool.query('CALL sp_eliminar_categoria(?)', [id]);
        res.json({ ok: true, mensaje: 'Categoría eliminada' });
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: 'Error al eliminar categoría', error: error.message });
    }
};