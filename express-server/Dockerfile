FROM node:20.12.0-alpine3.19

ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /usr/src/app

COPY package*.json package-lock.json tsconfig.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 8000

CMD ["npm", "start"]