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

module.exports = {
    parserHttpResponse
};