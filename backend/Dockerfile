FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY shared/package.json shared/

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--workspace", "@drive-narrator/backend"]
