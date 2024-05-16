FROM oven/bun:alpine

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
RUN bun install --omit=dev

COPY . /app
CMD ["bun", "start"]
