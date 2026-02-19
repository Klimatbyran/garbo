FROM node:lts-alpine3.20

RUN apk update
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    python3 \
    make \
    g++ \
    ca-certificates \
    ttf-freefont \
    pixman-dev \
    cairo-dev \
    pango-dev \
    giflib-dev \
    libjpeg-turbo-dev \
    ghostscript \
    graphicsmagick

COPY package*.json /app/
WORKDIR /app
RUN npm audit --omit=dev --audit-level=high
COPY prisma /app/
RUN npm ci --omit=dev
RUN npx prisma generate

COPY . /app
CMD ["npm", "start"]
