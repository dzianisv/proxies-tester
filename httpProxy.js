const net = require('net');

function connect(host, port, proxy, timeout=3000) {
    return new Promise((resolve, reject) => {
        const socket = net.createConnection(proxy.port, proxy.ip);
        socket.setTimeout(timeout);

        socket.on('connect', () => {
            console.log(__filename, 'connected to ', proxy.ip, proxy.port);
            resolve(socket);
        });

        socket.on('error', (err) => {
            console.error(err);
            reject(err);
        });

        socket.on('timeout', () => {
            console.error(__filename, 'http proxy connect timeout');
            reject('http proxy connect timeout');
        })
    });
}


module.exports = {
    connect
};