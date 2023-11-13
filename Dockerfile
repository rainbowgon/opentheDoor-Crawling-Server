FROM node:18
RUN ls -al
RUN pwd
WORKDIR /app
COPY . .
RUN npm install
RUN ls -al
RUN pwd
CMD ["npm", "run", "start"]