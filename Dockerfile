FROM node:18
RUN npm install
CMD ["npm", "run", "start"]