#!/bin/bash

# Digitpen Hub - Quick Deployment Script
# This script will guide you through the deployment process

set -e  # Exit on error

echo "🚀 Digitpen Hub - Local Deployment"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "📍 Working directory: $SCRIPT_DIR"
echo ""

# Step 1: Check prerequisites
echo "Step 1: Checking prerequisites..."
echo "================================="

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} npm installed: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    echo -e "${GREEN}✓${NC} PostgreSQL installed: $PSQL_VERSION"
else
    echo -e "${RED}✗${NC} PostgreSQL not found. Please install PostgreSQL"
    exit 1
fi

echo ""

# Step 2: Database setup
echo "Step 2: Database Setup"
echo "======================"
echo ""
echo -e "${YELLOW}Please run the following command in a separate terminal:${NC}"
echo ""
echo "  psql -U postgres -f $SCRIPT_DIR/setup-database.sql"
echo ""
echo "Or manually create the database:"
echo ""
echo "  sudo -u postgres psql"
echo "  CREATE DATABASE digitpenhub;"
echo "  CREATE USER digitpenhub WITH PASSWORD 'digitpenhub';"
echo "  GRANT ALL PRIVILEGES ON DATABASE digitpenhub TO digitpenhub;"
echo "  \\c digitpenhub"
echo "  GRANT ALL ON SCHEMA public TO digitpenhub;"
echo "  \\q"
echo ""
read -p "Press Enter once database is set up..."

# Test database connection
echo ""
echo "Testing database connection..."
if PGPASSWORD=digitpenhub psql -U digitpenhub -d digitpenhub -c "SELECT 1;" &> /dev/null; then
    echo -e "${GREEN}✓${NC} Database connection successful"
else
    echo -e "${RED}✗${NC} Cannot connect to database. Please check setup."
    exit 1
fi

echo ""

# Step 3: Backend setup
echo "Step 3: Backend Setup"
echo "====================="
cd "$BACKEND_DIR"

echo "Installing backend dependencies..."
npm install

echo ""
echo "Running database migrations..."
npm run migrate

echo ""
echo -e "${GREEN}✓${NC} Backend setup complete"
echo ""

# Step 4: Frontend setup
echo "Step 4: Frontend Setup"
echo "======================"
cd "$FRONTEND_DIR"

echo "Installing frontend dependencies..."
npm install

echo ""
echo "Building frontend..."
npm run build

echo ""
echo -e "${GREEN}✓${NC} Frontend setup complete"
echo ""

# Step 5: Start services
echo "Step 5: Starting Services"
echo "========================="
echo ""
echo -e "${YELLOW}Starting backend server...${NC}"
echo "Backend will run on: http://localhost:5000"
echo ""

cd "$BACKEND_DIR"
npm start &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend is running (PID: $BACKEND_PID)"
else
    echo -e "${RED}✗${NC} Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${YELLOW}Starting frontend server...${NC}"
echo "Frontend will run on: http://localhost:4000"
echo ""

cd "$FRONTEND_DIR"
npm start &
FRONTEND_PID=$!

echo "Waiting for frontend to start..."
sleep 10

# Check if frontend is running
if curl -s http://localhost:4000 > /dev/null; then
    echo -e "${GREEN}✓${NC} Frontend is running (PID: $FRONTEND_PID)"
else
    echo -e "${RED}✗${NC} Frontend failed to start"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Services running:"
echo "  • Backend:  http://localhost:5000"
echo "  • Frontend: http://localhost:4000"
echo ""
echo "Process IDs:"
echo "  • Backend PID:  $BACKEND_PID"
echo "  • Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Or press Ctrl+C to stop this script (services will continue running)"
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:4000 in your browser"
echo "  2. Register a new account"
echo "  3. Test the application"
echo ""
echo "View logs:"
echo "  • Backend:  tail -f $BACKEND_DIR/logs/*.log"
echo "  • Frontend: Check terminal output"
echo ""

# Keep script running
echo "Press Ctrl+C to exit (services will continue running)..."
wait
