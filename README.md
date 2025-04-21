## Database Setup

1. Start PostgreSQL database in docker:

```bash
docker run -d \
  --name twistmaster-db \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=twistmaster \
  -v postgres-data:/var/lib/postgresql/data \
  postgis/postgis:15-3.3
```

2. Connect to the database
```bash
docker exec -it twistmaster-db psql -U postgres twistmaster
```

3. In PostgreSQL shell, enable required extensions
```sql
CREATE EXTENSION postgis;
CREATE EXTENSION hstore;
```

## OSRM Routing Engine setup

1. Start OSRM Routing Engine:
```bash
cd osrm-data
docker run -d -p 5000:5000 -v $(pwd):/data osrm/osrm-backend osrm-routed --algorithm mld /data/cumbria-latest.osrm
```