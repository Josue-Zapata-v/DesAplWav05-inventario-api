import express from 'express';
import categoriasRoutes from './routes/categorias.routes.js';
import productosRoutes from './routes/productos.routes.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Rutas
app.use('/api/categorias', categoriasRoutes);
app.use('/api/productos', productosRoutes);

// Ruta base
app.get('/', (req, res) => {
    res.json({ mensaje: 'API Inventario funcionando' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});