import { core, LOGGER_KEY } from '@sfcc-core/core';
import { CORE_GRAPHQL_KEY, EXPRESS_KEY } from '@sfcc-core/core-graphql';
import { API_CONFIG_KEY } from '@sfcc-core/apiconfig';

/** Register BFF modules **/
import '@sfcc-core/logger';
import '@sfcc-core/apiconfig';
import '@sfcc-core/core-graphql';
import '@sfcc-bff/productapi';
import '@sfcc-bff/basketapi';

class BFFApplication {

    constructor(config) {
        this.apiConfig = core.getService(API_CONFIG_KEY);
        Object.assign(config, this.apiConfig.config);
        this.apiConfig.config = config;
        _validateConfig(this.apiConfig.config);

        this.logger = core.getService(LOGGER_KEY);

        if (this.apiConfig.config.COMMERCE_LOG_LEVEL) {
            this.logger.setLevel(this.apiConfig.config.COMMERCE_LOG_LEVEL);
        }
    }

    set expressApplication(expressApp) {
        core.registerService(EXPRESS_KEY, function() {
            return expressApp;
        });
    }

    get expressApplication() {
        return core.getService(EXPRESS_KEY);
    }

    start() {
        core.getService(CORE_GRAPHQL_KEY).start();
        this.status();
    }

    status() {
        this.logger.debug(
            'Is Express Registered?',
            !!core.getService(EXPRESS_KEY),
        );
        this.logger.debug(
            'Is GraphQL Registered?',
            !!core.getService(CORE_GRAPHQL_KEY),
        );

        Object.getOwnPropertySymbols(core.services).forEach(key => {
            this.logger.debug(`Registered Core Service: ${key.toString()}.`);
        });

        Object.getOwnPropertySymbols(core.extensions).forEach(key => {
            this.logger.debug(
                `Registered Core Extensions: ${key.toString()}. ${
                    core.getExtension(key).length
                } Extensions Registered.`,
            );
        });
    }
}

function _validateConfig(config) {
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

export function getApp(config) {
    return new BFFApplication(config);
}
