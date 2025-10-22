# Вихідний образ
FROM node:20-alpine

# Робоча директорія
WORKDIR /app

# Копіюємо package.json та package-lock.json
COPY package*.json ./

# Встановлюємо залежності
RUN npm install

# Копіюємо весь код
COPY . .

# Компіляція TypeScript
RUN npm run build

# Старт NestJS
CMD ["npm", "run", "start:dev"]
