# Stage 1: build the Angular app with Node.js
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production \
 && mkdir /out \
 && cp -r dist/*/* /out/

# Stage 2: serve the built files with nginx
FROM nginx:1.28-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /out /usr/share/nginx/html
EXPOSE 80
