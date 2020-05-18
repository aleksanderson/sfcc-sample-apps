import passport from 'passport';
import * as graphqlPassport from 'graphql-passport';
import express from 'express';
import expressSession from 'express-session';
import url from 'url';

import redis from 'redis';
import connectRedis from 'connect-redis';

import * as CommerceSdk from 'commerce-sdk';
import { getCommerceClientConfig } from '@sfcc-core/apiconfig';

import 'dotenv/config.js';

import { getApp } from './app';

const port = process.env.PORT || 3000;
const mode = process.env.NODE_ENV || 'development';

const users = new Map();

function validateConfig(config) {
    const REQUIRED_KEYS = [
        'COMMERCE_API_PATH',
        'COMMERCE_CLIENT_API_SITE_ID',
        'COMMERCE_CLIENT_CLIENT_ID',
        'COMMERCE_CLIENT_REALM_ID',
        'COMMERCE_CLIENT_INSTANCE_ID',
        'COMMERCE_CLIENT_ORGANIZATION_ID',
        'COMMERCE_CLIENT_SHORT_CODE',
        'COMMERCE_SESSION_SECRET',
    ];

    REQUIRED_KEYS.forEach(KEY => {
        if (!config[KEY]) {
            console.log(
                `Make sure ${KEY} is defined within api.js or as an environment variable`
            );
            process.exit(1);
        }
    });
}

/**
 * Setup and Start Server
 */
(async () => {
    const app = await getApp();
    const config = app.apiConfig.config;
    validateConfig(config);

    //
    // Use this middleware when graphql-passport context.authenticate() are called
    // to retrieve a shopper token from the sdk. provide {id,token} to passport on success.
    //
    passport.use(
        new graphqlPassport.GraphQLLocalStrategy(function(user, pass, done) {
            const clientConfig = getCommerceClientConfig(config);
            CommerceSdk.helpers
                .getShopperToken(clientConfig, { type: 'guest' })
                .then(token => {
                    const customerId = JSON.parse(token.decodedToken.sub)
                        .CustomerInfo.customerId;
                    done(null, {
                        id: customerId,
                        token: token.getBearerHeader(),
                    });
                })
                .catch(error => done(error));
        }),
    );

    passport.serializeUser(function(user, done) {
        users.set(user.id, user);
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        done(null, users.get(id));
    });

    // Create Express Instance, register it with demo app and start demo app.
    app.expressApplication = express();

    // configure session
    const sess = {
        secret: config.COMMERCE_SESSION_SECRET, // This is something new we add to the config
        cookie: {},
    };
    if(process.env.REDIS_URL) {
        const redisClient = redis.createClient();
        const redisStore = connectRedis(expressSession);
        const { hostname, port } = url.parse(process.env.REDIS_URL);
        //redis config
        sess.resave = false;
        sess.saveUninitialized = true
        sess.store = new redisStore({ 
            host: hostname, 
            port,
            client: redisClient, 
            ttl: 86400
        });
    }

    if (mode === 'production') {
        app.expressApplication.set('trust proxy', 1); // trust first proxy
        sess.cookie.secure = true; // serve secure cookies
    }

    app.expressApplication.disable('x-powered-by');

    // generate cookie
    app.expressApplication.use(expressSession(sess));

    app.expressApplication.use(passport.initialize());
    app.expressApplication.use(passport.session());

    app.start();

    // start the server
    const server = app.expressApplication.listen(port, () => {
        const portToTellUser = server.address().port;

        console.log('======== BFF runtime ======== ');
        console.log(
            `🌩 Client Server up on ==============> http://localhost:${portToTellUser} <=========== Client UI ========== 🌩`
        );
        console.log(
            `🚀 Apollo GraphQL Server up on ======> http://localhost:${portToTellUser}${app.apiConfig.config.COMMERCE_API_PATH} <=== Apollo GraphQL ===== 🚀`
        );
    });

    return server;
})();
