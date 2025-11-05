FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# NestJS буде слухати порт з ENV
EXPOSE ${APP_PORT}

CMD ["node", "dist/main.js"]
