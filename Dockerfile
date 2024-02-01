FROM node
COPY package*.json /app/
WORKDIR /app
RUN npm install --omit=dev

COPY . /app
CMD ["npm", "start"]
