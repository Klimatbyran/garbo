FROM alpine:latest

RUN apk update
RUN apk add --no-cache \
    nodejs=22.11.0-r0 \
    npm=10.9.1-r0 \
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
    graphicsmagick=1.3.45-r0

COPY package*.json /app/
COPY prisma /app/
WORKDIR /app
RUN npm ci --omit=dev
RUN npx prisma generate

COPY . /app
CMD ["npm", "start"]
