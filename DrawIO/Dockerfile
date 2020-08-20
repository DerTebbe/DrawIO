FROM node:latest as build

COPY client/package.json client/package-lock.json ./
RUN npm ci && mkdir /ng-app && mv ./node_modules/ ./ng-app
WORKDIR /ng-app
ADD client/ .

RUN npm run-script build -- --prod


FROM node:latest
COPY --from=build /ng-app/dist /srv/DrawIO/client/dist/
ADD server/ /srv/DrawIO/server
ADD config.ts /srv/DrawIO/server/config/
WORKDIR /srv/DrawIO/server
RUN npm i && npm install -g typescript
RUN tsc ./src/server.ts && tsc ./model/*.ts && tsc ./config/config.ts

EXPOSE 80 443

CMD ["npm", "run-script", "run"]
