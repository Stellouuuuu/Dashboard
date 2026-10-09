FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Template (not a static file): the official nginx entrypoint runs envsubst on
# /etc/nginx/templates/*.template at container start, substituting ${API_ORIGIN}
# from the environment — same image works locally (docker-compose) and on Render.
COPY nginx/nginx.conf.template /etc/nginx/templates/default.conf.template
