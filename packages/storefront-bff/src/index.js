import 'dotenv/config.js';

import { getApp } from './app';
import config from './config';
import server from './server';

(async () => {
    const app = getApp(config);
    app.expressApplication = server;
    app.start();
})();