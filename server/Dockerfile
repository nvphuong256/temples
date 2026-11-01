FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY shared ./shared
COPY server ./server
RUN npm ci --workspace shared --workspace server && npm -w shared run build && npm -w server run build
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 2567
CMD ["node", "server/dist/index.js"]
