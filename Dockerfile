FROM node
ADD ./ ./src/
WORKDIR ./src/
RUN npm install
CMD ["npm", "run", "serve"]