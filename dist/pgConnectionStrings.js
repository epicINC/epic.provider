"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url = require("url");
function parse(data) {
    const params = url.parse(data);
    const auth = params.auth && params.auth.split(':');
    return {
        user: auth && auth[0] || 'postgres',
        password: auth && auth[1] || '',
        host: params.hostname || '',
        port: params.port && Number.parseInt(params.port) || 5432,
        database: params.pathname && params.pathname.split('/')[1] || '',
        ssl: params.protocol && params.protocol.endsWith('s') || false
    };
}
exports.parse = parse;
exports.default = parse;
//# sourceMappingURL=pgConnectionStrings.js.map