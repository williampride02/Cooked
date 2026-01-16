#!/bin/bash
# E2E Test Runner
# Usage: ./scripts/run-e2e.sh [flow-name]

# Set up Java (required for Maestro)
export JAVA_HOME="/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH:$HOME/.maestro/bin"

# Disable analytics
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

# Run tests
if [ -z "$1" ]; then
    echo "Running all E2E tests..."
    maestro test .maestro/flows/
else
    echo "Running E2E test: $1"
    maestro test ".maestro/flows/$1.yaml"
fi
