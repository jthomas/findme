FROM openwhisk/action-nodejs-v8:latest

RUN npm install @tensorflow/tfjs @tensorflow/tfjs-node

COPY weights weights
