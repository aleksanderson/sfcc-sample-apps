import passport from 'passport';
import * as graphqlPassport from 'graphql-passport';
import * as CommerceSdk from 'commerce-sdk';
import { getCommerceClientConfig } from '@sfcc-core/apiconfig';

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
    //users.set(user.id, user);
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    done(null, users.get(id));
});

export default passport;