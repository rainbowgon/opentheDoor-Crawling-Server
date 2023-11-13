FROM node:18
WORKDIR /app
COPY . .
RUN npm install
RUN sudo apt install libgtk-3-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2
CMD ["npm", "run", "start"]