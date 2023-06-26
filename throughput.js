const httpConnectProxy = require('./httpConnectProxy');
const socksProxy = require('./socksProxy');
const httpProxy = require('./httpProxy');

const tls = require('tls');
const url = require('url');

async function tcpConnect(host, port, proxy) {
    console.log(__filename, 'connecting to the proxy', proxy);
    if (proxy.protocol == 'http') {
        return await httpProxy.connect(host, port, proxy)
    } else if (proxy.protocol === 'socks4' || proxy.protocol === 'socks5') {
        return await socksProxy.connect(host, port, proxy);
    } else {
        throw new Error('Unsupported proxy prootocol');
    }
}

async function tlsConnect(host, port, proxy) {
    let upstreamSocket;
    console.log(__filename, 'connecting to the proxy', proxy);
    if (proxy.protocol == 'http') {
        upstreamSocket = await httpConnectProxy.connect(host, port, proxy);
    } else if (proxy.protocol === 'socks4' || proxy.protocol === 'socks5') {
        upstreamSocket = await socksConnect.connect(proxy);
    } else {
        throw new Error('Unsupported proxy prootocol');
    }

    const tlsOptions = {
        socket: upstreamSocket,
        host,
        port,
        servername: host,
    };

    return tls.connect(tlsOptions);
}

async function GET(targetUrl, proxy) {
    const parsedUrl = url.parse(targetUrl, true);
    console.log(__filename, 'establishing a connection with', parsedUrl.host, 'over', proxy);

    let stream;
    let event;
    try {
        if (parsedUrl.protocol == "https:") {
            stream = await tlsConnect(parsedUrl.hostname, parsedUrl.port || 443, proxy);
            event = 'secureConnect';
        } else if (parsedUrl.protocol == "http:") {
            stream = await tcpConnect(parsedUrl.hostname, parsedUrl.port || 80, proxy);
            event = 'connect';
            // we reuse the same socket that is connected to the proxy
            // let's emit a connect event then
            setTimeout(() => stream.emit('connect'), 0);
        }
    } catch (err) {
        console.log(__filename, 'failed to conencto to the proxy', proxy, err);
        throw new Error('failed to connect to the proxy', err);
    }

    return new Promise((resolve, reject) => {
        stream.on(event, () => {
            console.log(__filename, 'GET', targetUrl, proxy, 'connected');
            stream.write(`GET ${parsedUrl.pathname} HTTP/1.1\r\nHost: ${parsedUrl.hostname}\r\n\r\n`);
            resolve(stream);
        });
    });
}

function parserHttpResponse(data) {
    const end = data.indexOf('\r\n\r\n');;
    if (end == -1) {
        return null;
    }

    const header = data.toString('utf8').substring(0, end);
    const lines = header.toString().split('\r\n');

    // The status line is the first line of the response
    const statusLine = lines[0];
    // The status code is the second element of the status line when split by spaces
    const statusParts = statusLine.split(' ');
    const statusCode = parseInt(statusParts[1], 10);
    const statueMessage = statusParts.slice(2).join(' ');

    // Headers start from the second line to the first empty line
    const headers = {};
    for (let i = 1; i < lines.length; i++) {
        if (lines[i] === '') break;

        const [key, ...value] = lines[i].split(': ');
        headers[key] = value.join(': ');
    }

    return {
        statusCode,
        statueMessage,
        headers
    };
}

async function testThrougput(proxy, timeout = 3000, testUrl = 'http://ipv4.download.thinkbroadband.com/10MB.zip') {
    const start = Date.now();
    console.log(__filename, 'GET', testUrl);
    const stream = await GET(testUrl, proxy);

    return new Promise((resolve, reject) => {
        let dataReceived = 0;
        // Send the HTTP GET request
        let chunks = [];

        stream.on('data', (chunk) => {
            if (chunks) {
                chunks.push(chunk);
                const response = parserHttpResponse(Buffer.concat(chunks));

                if (!response) {
                    //wait for another chunk with all the HTTP resopnse
                    return;
                }

                chunks = null; // if chucnks is null, header is parsed

                if (response.statusCode != 200) {
                    console.log(__filename, "invalid response", response.statueMessage, response.statusCode, 'for', proxy.protocol, proxy.ip, proxy.port);
                    stream.end();
                    reject(response.statueMessage);
                    return;
                }
                console.log(__filename, 'response', JSON.stringify(response), 'for', proxy.protocol, proxy.ip, proxy.port);
            }

            dataReceived += chunk.length;
        });

        setTimeout(() => {
            console.log(__filename, timeout, 'timeout', proxy.ip, proxy.port);``
            stream.end();
        }, timeout);

        stream.on('end', () => {
            const time = Date.now() - start;
            const throughput = dataReceived * 1000 / time;
            console.info(__filename, 'GET', testUrl, 'time', time, 'througput', throughput);
            resolve(throughput);
        });

        stream.on('error', (error) => {
            console.error('Download error: ', error);
            reject(error);
        });
    });
}

module.exports = {
    testThrougput
};
