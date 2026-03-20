FROM node:20-alpine

# Instalar mysql-client para mysqldump/restore en backups
RUN apk add --no-cache mysql-client

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY src/ ./src/

RUN mkdir -p src/uploads src/backups

EXPOSE 3001

CMD ["node", "src/index.js"]
