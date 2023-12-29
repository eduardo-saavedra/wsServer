const WebSocket = require('ws');
const http = require('http');

// Create HTTP server to handle initial requests
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running');
});

// Map to store WebSocket instances
const instances = new Map();

// Handle WebSocket upgrade requests
server.on('upgrade', (request, socket, head) => {
  // Extract the instance ID from the URL
  const pathname = new URL(request.url, 'https://localhost').pathname;
  const instanceId = pathname.replace(/^\//, '');

  // Check if an instance with the given ID exists, otherwise create a new one
  let instance = instances.get(instanceId);

  if (!instance) {
    instance = new WebSocket.Server({ noServer: true });
    console.info(`⛔⛔⛔`, instance);
    // Handle connections for the dynamically created instance
    instance.on('connection', (ws) => {
      console.log(`Client connected to Instance ${instanceId}`);

      ws.on('message', (message) => {
        console.log(`Instance ${instanceId} received: ${message}`);
        ws.send(`Instance ${instanceId} received: ${message}`);
      });
    });

    // Save the instance in the map
    instances.set(instanceId, instance);
  } else {
    instance.on('connection', (ws) => {
      console.info('⛔⛔⛔ Client connected');
      // Event Listener for the incommming messages
      ws.on('message', function message(data, isBinary) {
        instance.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(data, { binary: isBinary });
          }
        });
      });

      // Event listener for when the connection fails
      ws.on('error', console.error);

      // Event listener for when the client closes the connection
      ws.on('close', () => {console.info('Client disconnected')});
    });
  }

  // Upgrade the connection to WebSocket based on the instance
  instance.handleUpgrade(request, socket, head, (ws) => {
    instance.emit('connection', ws, request);
  });
});

// Start the server on port 9000
const PORT = 9000;
server.listen(PORT, () => {console.log(`Server is listening on port ${PORT}`)});

