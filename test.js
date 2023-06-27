const tester = require('./stdlibTester');


(async () => {
    const socksProxyThrougput = await tester.testProxy({
         ip: "127.0.0.1",
         port: 1080,
         protocol: "socks5"
    });
    console.log('socks proxy througput', socksProxyThrougput);


    const httpProxyThrougput = await tester.testProxy({
        ip: "127.0.0.1",
        port: 8080,
        protocol: "http"
    });

    console.log('http proxy througput', httpProxyThrougput);
})();