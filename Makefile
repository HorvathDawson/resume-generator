# Makefile for the Handlebars Resume Generator

# --- Variables ---
# Use the node_modules/.bin directory to find local executables
NODE_EXEC := ./node_modules/.bin

# Default target: Show help message if no command is given
.DEFAULT_GOAL := help

# --- Targets ---

# Help message
.PHONY: help
help:
	@echo "----------------------------------------------------"
	@echo " ✨ Handlebars Resume Generator Commands"
	@echo "----------------------------------------------------"
	@echo " make init        - Installs all project dependencies"
	@echo " make build       - Builds a specific resume (e.g., make build resume=service)"
	@echo " make build-all   - Builds all resumes from the 'data/' folder"
	@echo " make watch       - Auto-rebuilds a resume on file changes (e.g., make watch resume=service)"
	@echo " make preview     - Starts the local preview server (npm run preview)"
	@echo " make clean       - Deletes the 'dist/' output folder"
	@echo "----------------------------------------------------"

# Target to install dependencies
.PHONY: init
init:
	@echo "📦 Installing dependencies..."
	@npm install

# Target to build a single resume from the 'data' folder
.PHONY: build
build:
	@if [ -z "$(resume)" ]; then \
		echo "❌ Error: Please specify a resume name."; \
		echo "Usage: make build resume=<filename>"; \
		exit 1; \
	fi
	@echo "🚀 Building resume: $(resume).json..."
	@node build.js data/$(resume).json

# Target to automatically rebuild a resume when source files change
.PHONY: watch
watch:
	@if [ -z "$(resume)" ]; then \
		echo "❌ Error: Please specify a resume name."; \
		echo "Usage: make watch resume=<filename>"; \
		exit 1; \
	fi
	@echo "👀 Watching for changes to build $(resume).json..."
	@$(NODE_EXEC)/nodemon --watch templates/ --watch scss/ --watch data/$(resume).json --ext "hbs,scss,json" --exec "make build resume=$(resume)"

# Target to build all .json files in the 'data' directory
.PHONY: build-all
build-all:
	@echo "🚀 Building all resumes from the 'data/' directory..."
	@for file in data/*.json; do \
		echo "   -> Processing $$file..."; \
		node build.js $$file; \
	done
	@echo "✅ All resumes built successfully."

# Target to clean up generated files
.PHONY: clean
clean:
	@echo "🧹 Cleaning up generated files..."
	@rm -rf dist
	@echo "✅ 'dist/' folder removed."