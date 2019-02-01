FROM node
ADD ./ ./src/
WORKDIR ./src/
RUN npm install
RUN npm install browserify
EXPOSE 3000
CMD ["npm", "run", "serve"]