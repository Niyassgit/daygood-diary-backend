FROM node:22-alpine
#alpine is a lightweight Linux distribution, so the image is much smaller.

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]