FROM node:alpine

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

COPY package*.json /app/
WORKDIR /app
RUN npm install --omit=dev

COPY . /app
CMD ["npm", "start"]
