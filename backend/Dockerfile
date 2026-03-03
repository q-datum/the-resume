# ---- build stage ----
FROM gradle:8.7-jdk17-alpine AS build
WORKDIR /home/gradle/project

COPY build.gradle* settings.gradle* gradle.properties* gradlew ./
COPY gradle ./gradle
COPY src ./src

RUN ./gradlew clean bootJar -x test

# ---- runtime stage ----
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=build /home/gradle/project/build/libs/*.jar app.jar

EXPOSE 8080

# Good defaults for 1 core / 1GB VPS (tweak later)
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=60 -XX:InitialRAMPercentage=20 -XX:+UseSerialGC"

ENTRYPOINT ["java","-jar","/app/app.jar"]