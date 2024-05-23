FROM node:alpine-22

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

COPY . /app
CMD ["npm", "start"]
