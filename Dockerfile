# Використовуємо офіційний Node.js образ
FROM node:20-alpine

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо package.json і package-lock.json
COPY package*.json ./

# Встановлюємо залежності
RUN npm install

# Копіюємо інші файли проєкту
COPY . .

# Компілюємо TypeScript у JS
RUN npm run build

# Вказуємо порт
EXPOSE 3000

# Запускаємо додаток
CMD ["npm", "run", "start:prod"]
