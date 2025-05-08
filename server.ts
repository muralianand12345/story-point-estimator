import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import path from 'path';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
    // Dynamically import the websocketHandler to avoid module resolution issues
    const { initWebSocketServer } = await import('./src/lib/websocketHandler');

    const server = createServer((req, res) => {
        if (!req.url) {
            res.statusCode = 400;
            res.end('Bad Request');
            return;
        }
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    // Initialize WebSocket server
    initWebSocketServer(server);

    // Add WebSocket upgrade handler
    server.on('upgrade', (request, socket, head) => {
        const pathname = request.url ? parse(request.url).pathname : null;

        if (pathname === '/ws') {
            const wss = initWebSocketServer(server);
            wss?.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });
}).catch(err => {
    console.error('Error starting server:', err);
    process.exit(1);
});