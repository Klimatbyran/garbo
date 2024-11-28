FROM ghcr.io/nlmatics/nlm-ingestor:latest

# Install Node.js 22
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

# Install app dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 3000

# Start both NLM ingestor and our Express service
CMD service nlm-ingestor start && npm start
