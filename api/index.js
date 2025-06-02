const fs = require('fs');
const path = require('path');

const scriptsDataFile = path.join(__dirname, 'scripts.json');

function sendError(res, message, statusCode) {
    res.status(statusCode).json({ error: message });
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (req.method === 'GET') {
        const searchQuery = req.query.q;

        if (searchQuery !== undefined) {
            try {
                let scripts = [];
                if (fs.existsSync(scriptsDataFile)) {
                    const scriptsJson = fs.readFileSync(scriptsDataFile, 'utf-8');
                    try {
                        scripts = JSON.parse(scriptsJson);
                        if (!Array.isArray(scripts)) {
                            console.error('scripts.json no contiene un array JSON válido. Tratando como lista vacía.');
                            scripts = [];
                        }
                    } catch (parseError) {
                        console.error('Error al parsear scripts.json:', parseError.message);
                        return sendError(res, 'Error al leer los datos de los scripts: ' + parseError.message, 500);
                    }
                } else {
                    console.warn(`Archivo de datos no encontrado: ${scriptsDataFile}. Se devolverán resultados vacíos.`);
                }

                const normalizedSearchQuery = String(searchQuery || '').toLowerCase().trim();
                let results = [];

                if (normalizedSearchQuery) {
                    results = scripts.filter(script => {
                        if (typeof script !== 'object' || script === null) {
                            return false;
                        }
                        const title = String(script.title || '').toLowerCase();
                        const description = String(script.description || '').toLowerCase();
                        return title.includes(normalizedSearchQuery) || description.includes(normalizedSearchQuery);
                    });
                }
                res.status(200).json({ query: String(searchQuery || ''), results: results });

            } catch (fileError) {
                console.error('Error al leer el archivo de datos de scripts:', fileError.message);
                return sendError(res, 'Error interno del servidor al acceder a los datos.', 500);
            }
        } else {
            res.status(200).json({
                api_name: 'StarLuck Scripts API',
                message: 'Bienvenido a la API gratuita de StarLuck Scripts. Para buscar scripts, usa el parámetro GET "q". Ejemplo: ?q=nombre_script',
                status: 'ok'
            });
        }
    } else {
        res.setHeader('Allow', 'GET, OPTIONS');
        sendError(res, 'Método no permitido.', 405);
    }
}