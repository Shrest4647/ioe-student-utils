# IOE Student Utils - Development Makefile
# Comprehensive utility commands for development workflow

SHELL := /bin/bash

help:
	@echo "Available commands:"
	@echo "  help: Show this help message"
	@echo "  build: Build the project"
	@echo "  test: Run tests"
	@echo "  install: Install the project"
	@echo "  lint: Run linting"
	@echo "  format: Format code"
	@echo "  typecheck: Check types"
	@echo "  ready: Format and typecheck"

build:
	@echo "Building the project..."
	bun run build

test:
	@echo "Running tests..."
	bun run test

install:
	@echo "Installing the project..."
	bun run install

lint:
	@echo "Running linting..."
	bun run check:write

format:
	@echo "Formatting code..."
	bun run check:unsafe

typecheck:
	@echo "Checking types..."
	bun run typecheck

ready: format typecheck