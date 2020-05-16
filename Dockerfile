# -- build stage --

FROM node:12.16.3-alpine AS build_stage

ARG BUILD_DIR=/usr/src/build

# create directory for the build artifacts
WORKDIR $BUILD_DIR

# insall dependencies (for building)
COPY packages ./packages
COPY package.json ./package.json
COPY yarn.lock ./yarn.lock
COPY lerna.json ./lerna.json
COPY tsconfig.json ./tsconfig.json
COPY tsconfig.build.json ./tsconfig.build.json
RUN yarn install --frozen-lockfile

# install global dependencies
RUN yarn global add tsdx

# build packages
RUN yarn build

# -- pack stage --

FROM node:12.16.3-alpine

# create directory for the app artifacts
WORKDIR /usr/src/app

# insall dependencies (for production)
COPY package.json ./package.json
COPY yarn.lock ./yarn.lock
COPY lerna.json ./lerna.json
COPY --from=build_stage /usr/src/build/packages ./packages
RUN yarn install --frozen-lockfile --production

CMD ["yarn", "start"]

