#!/bin/bash

set -e

echo "🚀 Setting up Cron Dashboard development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install it first.${NC}"
    exit 1
fi

# Check Node.js version
if ! command -v node > /dev/null 2>&1; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18 or higher is required. Current version: $(node -v)${NC}"
    exit 1
fi

# Check Python version
if ! command -v python3 > /dev/null 2>&1; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.11+ first.${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
if [ "$(echo "$PYTHON_VERSION < 3.11" | bc)" -eq 1 ]; then
    echo -e "${RED}❌ Python 3.11 or higher is required. Current version: $PYTHON_VERSION${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Create environment files
echo -e "${YELLOW}📄 Creating environment files...${NC}"

if [ ! -f .env ]; then
    cat > .env << 'EOF'
# Database
DB_PASSWORD=secure_password_2024
POSTGRES_DB=cron_dashboard
POSTGRES_USER=cron_user

# Redis
REDIS_PASSWORD=redis_secure_2024

# JWT Secrets (change in production)
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production

# Analytics
ANALYTICS_API_KEY=dev-analytics-key

# Monitoring
GRAFANA_PASSWORD=admin

# Development URLs
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
REACT_APP_API_URL=http://localhost:4000
REACT_APP_WS_URL=ws://localhost:4000
REACT_APP_ANALYTICS_URL=http://localhost:8000
EOF
    echo -e "${GREEN}✅ Created .env file${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists, skipping...${NC}"
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"

# Root dependencies
if [ -f package.json ]; then
    npm install
    echo -e "${GREEN}✅ Root dependencies installed${NC}"
fi

# Frontend dependencies
if [ -d frontend ] && [ -f frontend/package.json ]; then
    cd frontend
    npm install
    cd ..
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
fi

# Backend dependencies
if [ -d backend ] && [ -f backend/package.json ]; then
    cd backend
    npm install
    cd ..
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
fi

# Test dependencies
if [ -d tests ] && [ -f tests/package.json ]; then
    cd tests
    npm install
    npx playwright install
    cd ..
    echo -e "${GREEN}✅ Test dependencies installed${NC}"
fi

# Python dependencies
if [ -d analytics ] && [ -f analytics/requirements.txt ]; then
    cd analytics
    python3 -m pip install -r requirements.txt
    cd ..
    echo -e "${GREEN}✅ Python dependencies installed${NC}"
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p logs/{nginx,app}
mkdir -p backend/uploads
mkdir -p analytics/models
mkdir -p database/backups

# Set permissions
chmod -R 755 logs
chmod -R 755 backend/uploads
chmod -R 755 analytics/models

echo -e "${GREEN}✅ Directories created${NC}"

# Initialize database
echo -e "${YELLOW}🗄️  Initializing database...${NC}"

# Start only database and redis for setup
docker-compose up -d postgres redis

# Wait for database to be ready
echo "Waiting for database to be ready..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U cron_user -d cron_dashboard; then
        echo -e "${GREEN}✅ Database is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Database failed to start${NC}"
        exit 1
    fi
    sleep 2
done

# Run database migrations
if [ -d backend/migrations ]; then
    cd backend
    npm run migrate
    cd ..
    echo -e "${GREEN}✅ Database migrations completed${NC}"
fi

# Seed initial data
if [ -d backend/seeds ]; then
    cd backend
    npm run seed
    cd ..
    echo -e "${GREEN}✅ Database seeded with initial data${NC}"
fi

# Stop services
docker-compose down

# Create useful aliases
echo -e "${YELLOW}⚙️  Creating useful aliases...${NC}"

cat >> ~/.bashrc << 'EOF'

# Cron Dashboard aliases
alias cron-dev='cd /path/to/cron-dashboard && docker-compose up'
alias cron-logs='cd /path/to/cron-dashboard && docker-compose logs -f'
alias cron-clean='cd /path/to/cron-dashboard && docker-compose down -v && docker system prune -f'
EOF

# Replace placeholder path
sed -i "s|/path/to/cron-dashboard|$(pwd)|g" ~/.bashrc

echo -e "${GREEN}✅ Aliases added to ~/.bashrc${NC}"

# Health check script
echo -e "${YELLOW}🏥 Creating health check script...${NC}"

cat > scripts/health-check.sh << 'EOF'
#!/bin/bash

echo "🏥 Health Check for Cron Dashboard"
echo "=================================="

# Check if services are running
services=("postgres" "redis" "backend" "frontend" "analytics")

for service in "${services[@]}"; do
    if docker-compose ps $service | grep -q "Up"; then
        echo "✅ $service: Running"
    else
        echo "❌ $service: Not running"
    fi
done

echo ""
echo "🌐 Endpoint Health Checks"
echo "========================"

# Frontend
if curl -sf http://localhost:3000 > /dev/null; then
    echo "✅ Frontend: http://localhost:3000"
else
    echo "❌ Frontend: http://localhost:3000"
fi

# Backend API
if curl -sf http://localhost:4000/health > /dev/null; then
    echo "✅ Backend API: http://localhost:4000"
else
    echo "❌ Backend API: http://localhost:4000"
fi

# GraphQL
if curl -sf http://localhost:4000/graphql > /dev/null; then
    echo "✅ GraphQL: http://localhost:4000/graphql"
else
    echo "❌ GraphQL: http://localhost:4000/graphql"
fi

# Analytics
if curl -sf http://localhost:8000/health > /dev/null; then
    echo "✅ Analytics: http://localhost:8000"
else
    echo "❌ Analytics: http://localhost:8000"
fi

echo ""
echo "📊 Resource Usage"
echo "=================="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
EOF

chmod +x scripts/health-check.sh

# Create VS Code settings
if command -v code > /dev/null 2>&1; then
    echo -e "${YELLOW}⚙️  Creating VS Code settings...${NC}"
    
    mkdir -p .vscode
    
    cat > .vscode/settings.json << 'EOF'
{
    "typescript.preferences.importModuleSpecifier": "relative",
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "emmet.includeLanguages": {
        "typescript": "typescriptreact",
        "javascript": "javascriptreact"
    },
    "python.defaultInterpreterPath": "./analytics/venv/bin/python",
    "python.formatting.provider": "black",
    "python.linting.enabled": true,
    "python.linting.flake8Enabled": true,
    "files.associations": {
        "*.env": "properties"
    }
}
EOF

    cat > .vscode/launch.json << 'EOF'
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug Backend",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/backend/src/index.ts",
            "env": {
                "NODE_ENV": "development"
            },
            "runtimeArgs": ["-r", "ts-node/register"],
            "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"]
        },
        {
            "name": "Debug Frontend",
            "type": "node",
            "request": "launch",
            "cwd": "${workspaceFolder}/frontend",
            "runtimeExecutable": "npm",
            "runtimeArgs": ["run", "dev"]
        }
    ]
}
EOF

    echo -e "${GREEN}✅ VS Code settings created${NC}"
fi

# Print success message and next steps
echo ""
echo -e "${GREEN}🎉 Development environment setup completed!${NC}"
echo ""
echo -e "${YELLOW}🚀 Next Steps:${NC}"
echo "1. Start the development environment:"
echo -e "   ${GREEN}docker-compose up${NC}"
echo ""
echo "2. Open your browser and navigate to:"
echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend API: ${GREEN}http://localhost:4000${NC}"
echo -e "   GraphQL Playground: ${GREEN}http://localhost:4000/graphql${NC}"
echo -e "   Analytics API: ${GREEN}http://localhost:8000${NC}"
echo -e "   Grafana: ${GREEN}http://localhost:3001${NC} (admin/admin)"
echo ""
echo "3. Run health checks:"
echo -e "   ${GREEN}./scripts/health-check.sh${NC}"
echo ""
echo "4. Run tests:"
echo -e "   ${GREEN}npm test${NC}"
echo ""
echo "5. View logs:"
echo -e "   ${GREEN}docker-compose logs -f${NC}"
echo ""
echo -e "${YELLOW}📖 Documentation:${NC}"
echo "- API Documentation: http://localhost:4000/docs"
echo "- Analytics Documentation: http://localhost:8000/docs"
echo "- Project README: ./README.md"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"