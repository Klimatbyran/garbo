FROM node:alpine

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

COPY package*.json /app/
WORKDIR /app
RUN npm install --omit=dev
RUN npx prisma generate

COPY . /app
CMD ["npm", "start"]
