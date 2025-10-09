FROM postgres:17

# Set environment variables
ENV POSTGRES_DB=lumiere-db-v17
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres

# Copy all SQL scripts
COPY *.sql /docker-entrypoint-initdb.d/00-structure/
COPY data/*.sql /docker-entrypoint-initdb.d/01-data/

# The scripts will be executed in alphabetical order automatically
# PostgreSQL will execute all scripts in /docker-entrypoint-initdb.d/ on first startup
