# Use Maven to build the application
FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Use a lightweight JRE to run the app
FROM eclipse-temurin:21-jre

# Create a non-root user with UID in the allowed range
RUN addgroup --system appgroup && adduser --system --uid 10001 --ingroup appgroup appuser

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Switch to the non-root user
USER 10001

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
