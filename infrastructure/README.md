# FilOps Infrastructure

This directory contains Docker Compose configuration and scripts for running FilOps infrastructure services locally.

## Services

### PostgreSQL (Port 5434)
- **Purpose**: Main database for metadata, policies, agents, deals
- **Credentials**: 
  - User: `filops`
  - Password: `filops`
  - Database: `filops`
- **Connection**: `postgresql://filops:filops@localhost:5434/filops`

### TimescaleDB (Port 5433)
- **Purpose**: Time-series database for metrics and monitoring
- **Credentials**:
  - User: `filops`
  - Password: `filops`
  - Database: `filops_metrics`
- **Connection**: `postgresql://filops:filops@localhost:5433/filops_metrics`

### Kafka (Port 9092)
- **Purpose**: Event bus for real-time events (PDP proofs, pricing updates, agent actions)
- **Bootstrap Servers**: `localhost:9092`
- **Topics**: Auto-created on first use

### Kafka UI (Port 8080)
- **Purpose**: Web interface for Kafka management
- **URL**: http://localhost:8080

### Zookeeper (Port 2181)
- **Purpose**: Coordination service for Kafka
- **Internal use only**

## Quick Start

### Using Make (Recommended)

```bash
# Start all services
make infra-start

# Check service health
make infra-check

# Stop services
make infra-stop

# Reset (clean restart)
make infra-reset
```

### Using Scripts Directly

```bash
# Start services
./infrastructure/scripts/start-infra.sh

# Check health
./infrastructure/scripts/check-services.sh

# Stop services
./infrastructure/scripts/stop-infra.sh

# Stop and remove all data
./infrastructure/scripts/stop-infra.sh --clean

# Reset everything
./infrastructure/scripts/reset-infra.sh
```

### Using Docker Compose Directly

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Health Checks

All services have health checks configured. You can verify service health with:

```bash
make infra-check
```

Expected output:
```
✅ PostgreSQL is running
✅ TimescaleDB is running
✅ Zookeeper is running
✅ Kafka is running
✅ Kafka UI is running
✅ PostgreSQL connection test passed
✅ TimescaleDB connection test passed
✅ Kafka connection test passed
🎉 All services are healthy!
```

## Testing Connections

### PostgreSQL
```bash
# Using psql
psql postgresql://filops:filops@localhost:5434/filops

# Using Docker
docker exec -it filops-postgres psql -U filops -d filops
```

### TimescaleDB
```bash
# Using psql
psql postgresql://filops:filops@localhost:5433/filops_metrics

# Using Docker
docker exec -it filops-timescaledb psql -U filops -d filops_metrics
```

### Kafka
```bash
# List topics
docker exec filops-kafka kafka-topics --bootstrap-server localhost:9092 --list

# Create a topic
docker exec filops-kafka kafka-topics --bootstrap-server localhost:9092 --create --topic test-topic

# Produce messages
docker exec -it filops-kafka kafka-console-producer --bootstrap-server localhost:9092 --topic test-topic

# Consume messages
docker exec -it filops-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic test-topic --from-beginning
```

## Data Persistence

All data is persisted in Docker volumes:
- `postgres_data` - PostgreSQL data
- `timescale_data` - TimescaleDB data
- `kafka_data` - Kafka data
- `zookeeper_data` - Zookeeper data
- `zookeeper_logs` - Zookeeper logs

To remove all data:
```bash
docker-compose down -v
```

## Troubleshooting

### Services not starting
```bash
# Check Docker is running
docker info

# View service logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]
```

### Port conflicts
If ports are already in use, you can modify them in `docker-compose.yml`:
- PostgreSQL: Currently using `5434:5432` (changed from default 5432 to avoid conflicts)
- TimescaleDB: Change `5433:5432` to `5435:5432` if needed
- Kafka: Change `9092:9092` to `9093:9092` if needed
- Kafka UI: Change `8080:8080` to `8081:8080` if needed

### Reset everything
```bash
# Nuclear option - removes all containers, volumes, and networks
docker-compose down -v
docker system prune -f
make infra-start
```

## Production Considerations

This setup is for **local development only**. For production:

1. Use managed services (AWS RDS, Confluent Cloud, etc.)
2. Enable SSL/TLS for all connections
3. Use strong passwords and secrets management
4. Configure proper backup and disaster recovery
5. Set up monitoring and alerting
6. Scale Kafka brokers and partitions appropriately
7. Configure retention policies
