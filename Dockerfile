# Ice Realm: builds the website and the Java backend, then runs them together as one app.
# Railway, Render or any host that runs Docker can use this. See docs/deploy.md.

# 1. Build the website into the backend's static folder.
FROM node:22-bookworm-slim AS website
WORKDIR /app
COPY frontend-next/package.json frontend-next/package-lock.json frontend-next/
RUN cd frontend-next && npm ci
COPY frontend-next frontend-next
RUN mkdir -p backend/src/main/resources && cd frontend-next && npm run build:backend

# 2. Build the Java app, with the website inside it.
FROM eclipse-temurin:21-jdk AS backend
WORKDIR /app/backend
COPY backend/mvnw backend/pom.xml ./
COPY backend/.mvn .mvn
COPY backend/src src
COPY --from=website /app/backend/src/main/resources/static src/main/resources/static
RUN chmod +x mvnw && ./mvnw -q -B -DskipTests package

# 3. Run it. The prod profile keeps the database on the /data disk, takes its port from the
#    host, and refuses to start until ICE_REALM_ADMIN_TOKEN (the staff code) is set.
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend /app/backend/target/backend-0.0.1-SNAPSHOT.jar app.jar
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
