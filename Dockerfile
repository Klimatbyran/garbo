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

# .npmrc must be here: npm ci otherwise rejects chromadb's optional openai@4 peer against openai 6.
COPY package*.json .npmrc /app/
WORKDIR /app
COPY prisma /app/
RUN npm ci --omit=dev
RUN npx prisma generate

COPY . /app
CMD ["npm", "start"]
