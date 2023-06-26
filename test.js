const tester = require('./throughput');


(async () => {
    await tester.testThrougput({
        ip: "127.0.0.1",
        port: 1080,
        protocol: "socks5"
    });

    await tester.testThrougput({
        ip: "127.0.0.1",
        port: 8080,
        protocol: "http"
    });
})();