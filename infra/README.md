# Deployment Scripts

This directory contains scripts for deploying the Cron Collaboration Dashboard to various environments.

## Quick Start

```bash
# Local development
./scripts/setup-dev.sh

# Build and deploy to staging
./scripts/deploy-staging.sh

# Deploy to production
./scripts/deploy-production.sh

# Health check
./scripts/health-check.sh
```

## Scripts Overview

### setup-dev.sh
Sets up local development environment with all dependencies.

### deploy-staging.sh
Deploys application to staging environment for testing.

### deploy-production.sh
Production deployment with blue/green strategy and rollback capability.

### health-check.sh
Comprehensive health checks for all services.

### backup-db.sh
Creates database backups before deployments.

### rollback.sh
Rollback functionality for failed deployments.

## Environment Variables

Required environment variables for deployment:

```bash
# Database
DB_PASSWORD=secure_password_2024
REDIS_PASSWORD=redis_secure_2024

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret

# Analytics
ANALYTICS_API_KEY=analytics-secure-key-2024

# Monitoring
GRAFANA_PASSWORD=admin_secure_2024

# AWS (for production)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-west-2

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

## Security Notes

- All secrets should be stored in a secure secrets manager
- Database passwords should be rotated regularly
- SSL certificates should be properly configured
- Regular security scans should be performed

## Monitoring

The deployment includes comprehensive monitoring:

- Prometheus metrics collection
- Grafana dashboards
- Log aggregation with Loki
- Health checks and alerts
- Performance monitoring

## Backup Strategy

- Daily automated database backups
- Weekly full system backups
- Backup retention: 30 days
- Cross-region backup replication for production

## Disaster Recovery

- RTO: 4 hours
- RPO: 1 hour
- Multi-region deployment capability
- Automated failover procedures