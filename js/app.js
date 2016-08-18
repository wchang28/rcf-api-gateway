var express_web_server_1 = require('express-web-server');
var fs = require('fs');
var path = require('path');
var express = require('express');
var noCache = require('no-cache-express');
var httpProxy = require('rcf-http-proxy');
var configFile = (process.argv.length < 3 ? path.join(__dirname, '../local_testing_config.json') : process.argv[2]);
var config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
var app = express();
app.use(noCache);
var targetAcquisition = function (req, done) {
    var targetSesstings = {
        targetUrl: config.targetSettings.instance_url
    };
    if (typeof config.targetSettings.rejectUnauthorized === 'boolean')
        targetSesstings.rejectUnauthorized = config.targetSettings.rejectUnauthorized;
    done(null, targetSesstings);
};
var proxyOptions = {
    targetAcquisition: targetAcquisition
};
app.use(httpProxy.get(proxyOptions));
express_web_server_1.startServer(config.webServerConfig, app, function (secure, host, port) {
    console.log('admin app server listening at %s://%s:%s', (secure ? 'https' : 'http'), host, port);
});
