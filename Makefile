# Development commands
.PHONY: docker-dev docker-dev-api docker-dev-ui local-dev local-dev-api local-dev-ui \
        install install-api install-ui test test-api test-ui \
        lint lint-api lint-ui clean docker-clean generate-api-client

# ======================
# Docker Development
# ======================
docker-dev:
	docker-compose up

docker-dev-api:
	docker-compose up api postgres

docker-dev-ui:
	docker-compose up ui

# ======================
# Local Development
# ======================
local-dev: local-dev-api local-dev-ui

# Create a temporary .env.local for local development
.env.local:
	cp .env .env.local
	sed -i 's/DB_HOST=postgres/DB_HOST=localhost/g' .env.local

local-dev-api: .env.local
	cd api && DB_HOST=localhost npm run start:dev

local-dev-ui: generate-api-client
	cd ui && npm start

# Start only postgres for local development
local-postgres:
	docker-compose up postgres

# ======================
# API Client Generation
# ======================
generate-api-client:
	@echo "Generating API client..."
	@if lsof -i:3000 > /dev/null; then \
		cd ui && npm run generate-api-client; \
	else \
		echo "Error: API server must be running on port 3000 to generate client"; \
		exit 1; \
	fi

# ======================
# Installation
# ======================
install: install-api install-ui

install-api:
	cd api && npm install

install-ui:
	cd ui && npm install

# ======================
# Testing
# ======================
test: test-api test-ui

test-api:
	cd api && npm test

test-ui:
	cd ui && npm test

# ======================
# Linting
# ======================
lint: lint-api lint-ui

lint-api:
	cd api && npm run lint

lint-ui:
	cd ui && npm run lint

# ======================
# Production
# ======================
prod:
	docker-compose -f docker-compose.prod.yml up -d

prod-build: generate-api-client
	cd ui && npm run build
	docker-compose -f docker-compose.prod.yml build

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

# ======================
# Cleanup
# ======================
docker-clean:
	docker-compose down -v
	docker-compose -f docker-compose.prod.yml down -v
	rm -f .env.local

clean:
	rm -rf api/node_modules
	rm -rf ui/node_modules
	rm -f .env.local
	rm -rf ui/src/lib/api-client

# ======================
# Helper commands
# ======================
ps:
	docker-compose ps

logs:
	docker-compose logs -f

# Show help
help:
	@echo "Available commands:"
	@echo ""
	@echo "Docker Development:"
	@echo "  make docker-dev        - Start all services in Docker"
	@echo "  make docker-dev-api    - Start API and postgres in Docker"
	@echo "  make docker-dev-ui     - Start UI in Docker"
	@echo ""
	@echo "Local Development:"
	@echo "  make local-dev         - Start both API and UI locally"
	@echo "  make local-dev-api     - Start API locally"
	@echo "  make local-dev-ui      - Start UI locally"
	@echo "  make local-postgres    - Start only postgres in Docker"
	@echo ""
	@echo "API Client:"
	@echo "  make generate-api-client - Generate TypeScript API client from OpenAPI spec"
	@echo ""
	@echo "Installation:"
	@echo "  make install          - Install all dependencies"
	@echo "  make install-api      - Install API dependencies"
	@echo "  make install-ui       - Install UI dependencies"
	@echo ""
	@echo "Testing and Linting:"
	@echo "  make test            - Run all tests"
	@echo "  make lint            - Lint all code"
	@echo ""
	@echo "Production:"
	@echo "  make prod            - Start production environment"
	@echo "  make prod-build      - Build production images"
	@echo "  make prod-logs       - View production logs"
	@echo ""
	@echo "Cleanup:"
	@echo "  make docker-clean    - Remove Docker containers and volumes"
	@echo "  make clean           - Remove node_modules and generated files"
