# Базовий образ
FROM node:20-alpine

# Робоча директорія
WORKDIR /app

# Копіюємо package.json і package-lock.json, щоб скористатися кешем npm
COPY package*.json ./

# Встановлюємо продакшн залежності
RUN npm install --frozen-lockfile

# Копіюємо весь код
COPY . .

# Компілія TypeScript
RUN npm run build

# Виставляємо порт
EXPOSE 3000

# Старт NestJS у development (для продакшн змінити на "start:prod")
CMD ["npm", "run", "start:dev"]
