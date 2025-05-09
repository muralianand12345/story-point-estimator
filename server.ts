import { createServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'url';
import next from 'next';
import { setupSocketServer } from './src/app/api/socket/route';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Create the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            // Be sure to pass `true` as the second argument to `url.parse`.
            // This tells it to parse the query portion of the URL.
            const parsedUrl = parse(req.url!, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('Internal Server Error');
        }
    });

    // Set up Socket.io
    setupSocketServer(server);

    server.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});