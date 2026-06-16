FROM node:18-alpine AS builder
WORKDIR /app
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV CI=false
COPY package*.json ./
RUN npm install --legacy-peer-deps
RUN npm install ajv@6.12.6 ajv-keywords@3.5.2 --legacy-peer-deps
COPY . .
RUN npm run build
FROM nginx:alpine AS final
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx-react.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
