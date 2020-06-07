import express from 'express';
import expressSession from 'express-session';
//import redis from 'redis';
import ioredis from 'ioredis';
import connectRedis from 'connect-redis';

import config from './config';
//import passport from './passport';
import passport from 'passport';

const port = process.env.PORT || 3000;
const mode = process.env.NODE_ENV || 'development';

//const users = new Map();

const expressApplication = express();

// configure session
const sess = {
    secret: config.COMMERCE_SESSION_SECRET, // This is something new we add to the config
    cookie: {},
};

if (process.env.REDIS_URL) {
    // const redisClient = redis.createClient();
    const redisStore = connectRedis(expressSession);
    //redis config
    sess.resave = false;
    sess.saveUninitialized = true
    // sess.store = new redisStore({ 
    //     host: 'redis', 
    //     // port: '6379',
    //     client: redisClient, 
    //     ttl: 86400
    // });
    sess.store = new ioredis(process.env.REDIS_URL);
}

if (mode === 'production') {
    expressApplication.set('trust proxy', 1); // trust first proxy
    sess.cookie.secure = true; // serve secure cookies
}

expressApplication.disable('x-powered-by');

// generate cookie
expressApplication.use(expressSession(sess));

expressApplication.use(passport.initialize());
expressApplication.use(passport.session());

expressApplication.listen(port, () => {
  console.log('======== BFF runtime ======== ');
  console.log(
      `🌩 Client Server up on ==============> http://localhost:${port} <=========== Client UI ========== 🌩`
  );
  console.log(
      `🚀 Apollo GraphQL Server up on ======> http://localhost:${port}${config.COMMERCE_API_PATH} <=== Apollo GraphQL ===== 🚀`
  );
});

export default expressApplication;