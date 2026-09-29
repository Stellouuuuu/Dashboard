FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# esbuild postinstall can hit ETXTBSY under BuildKit; serialize + one retry.
RUN npm ci --maxsockets 1 || (rm -rf node_modules && npm ci --maxsockets 1)
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --maxsockets 1 || (rm -rf node_modules && npm ci --omit=dev --maxsockets 1)
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
EXPOSE 3000
CMD ["npm", "run", "start"]
