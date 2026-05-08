.PHONY: help install setup start stop logs clean test lint format build

help:
	@echo "═════════════════════════════════════════════════════════"
	@echo "Order Service - NestJS Example"
	@echo "═════════════════════════════════════════════════════════"
	@echo ""
	@echo "Setup:"
	@echo "  make install     - Instalar dependencias"
	@echo "  make setup       - Setup completo (install + docker up)"
	@echo ""
	@echo "Development:"
	@echo "  make start       - Levantar servidor (npm run start:dev)"
	@echo "  make stop        - Detener servicios Docker"
	@echo "  make logs        - Ver logs de la aplicación"
	@echo ""
	@echo "Testing:"
	@echo "  make test        - Ejecutar tests unitarios"
	@echo "  make test-watch  - Tests en modo watch"
	@echo "  make test-cov    - Tests con coverage report"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint        - Ejecutar ESLint"
	@echo "  make format      - Aplicar Prettier"
	@echo "  make build       - Compilar proyecto"
	@echo ""
	@echo "Utilities:"
	@echo "  make psql        - Conectar a PostgreSQL"
	@echo "  make redis       - Conectar a Redis"
	@echo "  make clean       - Limpiar node_modules y dist"
	@echo ""

install:
	npm install

setup: install
	docker-compose up -d
	@echo "✅ Setup completo. Espera a que PostgreSQL esté listo..."
	@sleep 5
	docker-compose exec postgres pg_isready -U postgres
	@echo "✅ Servicios listos. Ejecuta: make start"

start:
	npm run start:dev

stop:
	docker-compose down

logs:
	docker-compose logs -f app

test:
	npm run test

test-watch:
	npm run test:watch

test-cov:
	npm run test:cov

lint:
	npm run lint

format:
	npm run format

build:
	npm run build

psql:
	docker-compose exec postgres psql -U postgres -d orderdb

redis:
	docker-compose exec redis redis-cli

clean:
	rm -rf node_modules dist coverage
	npm install

# Health check
health:
	@curl -s http://localhost:3000/health | jq .

# Database commands
db-logs:
	docker-compose logs -f postgres

db-reset:
	docker-compose down -v
	docker-compose up -d postgres

# GraphQL
graphql:
	@echo "GraphQL Playground: http://localhost:3000/graphql"
	@if command -v open > /dev/null; then open http://localhost:3000/graphql; fi

# Production
build-docker:
	docker build -t order-service:latest .

run-docker:
	docker run -p 3000:3000 --env-file .env order-service:latest
