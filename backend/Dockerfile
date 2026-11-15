FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline
COPY src ./src
RUN mvn -B -ntp package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN groupadd --system shop && useradd --system --gid shop shop
COPY --from=build /build/target/shopeasy-api.jar /app/shopeasy-api.jar
USER shop
ENV SPRING_PROFILES_ACTIVE=prod
ENV PORT=10000
EXPOSE 10000
ENTRYPOINT ["java", "-jar", "/app/shopeasy-api.jar"]
