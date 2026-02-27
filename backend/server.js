const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const TASKS_FILE = path.join(__dirname, 'tasks.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());



function readTasksFromFile() {
    try {
        if (!fs.existsSync(TASKS_FILE)) {
            // Si el archivo no existe, crear uno con un array vacío
            fs.writeFileSync(TASKS_FILE, JSON.stringify([]));
            return [];
        }
        const data = fs.readFileSync(TASKS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error leyendo el archivo:', error);
        return [];
    }
}

// Función para escribir tareas en el archivo
function writeTasksToFile(tasks) {
    try {
        fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
        return true;
    } catch (error) {
        console.error('Error escribiendo en el archivo:', error);
        return false;
    }
}

// Inicializar archivo si no existe
if (!fs.existsSync(TASKS_FILE)) {
    writeTasksToFile([]);
}

// Rutas de la API

app.get('/api/tasks', (req, res) => {
    console.log('📥 GET /api/tasks - Solicitando lista de tareas');
    const tasks = readTasksFromFile();
    res.json(tasks);
});


app.post('/api/tasks', (req, res) => {
    console.log('📤 POST /api/tasks - Creando nueva tarea');
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
        console.log('❌ Error: Texto de tarea vacío');
        return res.status(400).json({ error: 'El texto de la tarea es requerido' });
    }

    const tasks = readTasksFromFile();
    
    // Crear nueva tarea con ID único
    const newTask = {
        id: Date.now().toString(), // Usar timestamp como ID único
        text: text.trim(),
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    
    if (writeTasksToFile(tasks)) {
        console.log('✅ Tarea creada:', newTask);
        res.status(201).json(newTask);
    } else {
        console.log('❌ Error al guardar la tarea');
        res.status(500).json({ error: 'Error al guardar la tarea' });
    }
});


app.delete('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    console.log(`🗑️ DELETE /api/tasks/${taskId} - Eliminando tarea`);

    const tasks = readTasksFromFile();
    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex === -1) {
        console.log('❌ Error: Tarea no encontrada');
        return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const deletedTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);

    if (writeTasksToFile(tasks)) {
        console.log('✅ Tarea eliminada:', deletedTask);
        res.json({ message: 'Tarea eliminada correctamente', task: deletedTask });
    } else {
        console.log('❌ Error al eliminar la tarea');
        res.status(500).json({ error: 'Error al eliminar la tarea' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
    🚀 Servidor corriendo en http://localhost:${PORT}
    📝 API Endpoints:
        GET    → http://localhost:${PORT}/api/tasks
        POST   → http://localhost:${PORT}/api/tasks
        DELETE → http://localhost:${PORT}/api/tasks/:id
    `);
});