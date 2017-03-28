import {IWebServerConfig, startServer} from 'express-web-server';
import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import * as restIntf from 'rest-api-interfaces';
import noCache = require('no-cache-express');
import * as httpProxy from 'express-http-proxy'
import * as events from 'events';

interface IAppConfig {
    webServerConfig: IWebServerConfig;
    targetSettings: restIntf.ConnectOptions;
}

let configFile = (process.argv.length < 3 ? path.join(__dirname, '../local_testing_config.json') : process.argv[2]);
let config: IAppConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));

let app = express();

app.use(noCache);

let logHandler = (req:express.Request, res:express.Response, next:express.NextFunction) => {
	console.log('**********************************************************************');
	console.log(new Date().toISOString() + ': incoming request from ' + req.connection.remoteAddress + ":" + req.connection.remotePort + ', url='+ req.url);
	console.log('headers: ' + JSON.stringify(req.headers));
	console.log('**********************************************************************');
	console.log('');
	next();
}

app.use(logHandler);

let targetAcquisition: httpProxy.TargetAcquisition = (req:express.Request) => {
    let targetSesstings: httpProxy.TargetSettings = {
        targetUrl: config.targetSettings.instance_url
    }
    if (typeof config.targetSettings.rejectUnauthorized === 'boolean') targetSesstings.rejectUnauthorized = config.targetSettings.rejectUnauthorized;
    return Promise.resolve<httpProxy.TargetSettings>(targetSesstings);
};

let eventEmitter = new events.EventEmitter();

eventEmitter.on('error', (err: any) => {
    console.error(new Date().toISOString() + ": !!! Proxy error: " + err.toString());
});

app.use(httpProxy.get({targetAcquisition, eventEmitter}));

startServer(config.webServerConfig, app, (secure:boolean, host:string, port:number) => {
    console.log(new Date().toISOString() + ': api gateway server listening at %s://%s:%s', (secure ? 'https' : 'http'), host, port);
}, (err: any) => {
    console.error(new Date().toISOString() + ": !!! Error: " + JSON.stringify(err));
});
