#!/bin/bash

set -e

# Chatwell Pro Deployment Script
echo "🚀 Starting Chatwell Pro deployment..."

# Configuration
STACK_NAME="chatwell"
COMPOSE_FILE="chatwell-stack.yml"
REGISTRY="ghcr.io"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker Swarm is initialized
check_swarm() {
    print_status "Checking Docker Swarm status..."
    if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q active; then
        print_error "Docker Swarm is not active. Please initialize swarm first:"
        echo "  docker swarm init"
        exit 1
    fi
    print_success "Docker Swarm is active"
}

# Create Docker secrets
create_secrets() {
    print_status "Creating Docker secrets..."

    # List of required secrets
    secrets=(
        "db_password"
        "jwt_secret"
        "google_client_secret"
        "email_password"
        "waha_api_key"
    )

    for secret in "${secrets[@]}"; do
        if ! docker secret ls --format "{{.Name}}" | grep -q "^${secret}$"; then
            print_warning "Secret '${secret}' not found. Please create it:"
            echo "  echo 'your_secret_value' | docker secret create ${secret} -"
            echo "  # Or use: docker secret create ${secret} /path/to/secret/file"
        else
            print_success "Secret '${secret}' exists"
        fi
    done

    # Check if any secrets are missing
    missing_secrets=()
    for secret in "${secrets[@]}"; do
        if ! docker secret ls --format "{{.Name}}" | grep -q "^${secret}$"; then
            missing_secrets+=("$secret")
        fi
    done

    if [ ${#missing_secrets[@]} -gt 0 ]; then
        print_error "Missing required secrets: ${missing_secrets[*]}"
        print_warning "Create missing secrets and run deployment again"
        exit 1
    fi
}

# Create Docker networks
create_networks() {
    print_status "Creating Docker networks..."

    if ! docker network ls --format "{{.Name}}" | grep -q "^chatwell_frontend$"; then
        docker network create --driver overlay --attachable chatwell_frontend
        print_success "Created network: chatwell_frontend"
    else
        print_success "Network chatwell_frontend already exists"
    fi

    if ! docker network ls --format "{{.Name}}" | grep -q "^chatwell_backend$"; then
        docker network create --driver overlay chatwell_backend
        print_success "Created network: chatwell_backend"
    else
        print_success "Network chatwell_backend already exists"
    fi
}

# Deploy the stack
deploy_stack() {
    print_status "Deploying Chatwell Pro stack..."

    # Set environment variables
    export REGISTRY="${REGISTRY}"
    export TAG="${IMAGE_TAG}"
    export ACME_EMAIL="${ACME_EMAIL:-admin@chatwell.pro}"

    # Deploy the stack
    docker stack deploy -c "${COMPOSE_FILE}" "${STACK_NAME}"

    print_success "Stack deployment initiated"
}

# Monitor deployment
monitor_deployment() {
    print_status "Monitoring deployment progress..."

    # Wait for services to be ready
    local max_attempts=60
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        local running_services=$(docker stack services "${STACK_NAME}" --format "{{.Name}}" | wc -l)
        local ready_services=$(docker stack services "${STACK_NAME}" --format "{{.Name}} {{.Replicas}}" | grep -E '[0-9]+/[0-9]+' | awk '{split($2, a, "/"); if(a[1] == a[2] && a[1] > 0) print $1}' | wc -l)

        print_status "Services ready: ${ready_services}/${running_services}"

        if [ "$ready_services" -eq "$running_services" ] && [ "$running_services" -gt 0 ]; then
            print_success "All services are ready!"
            break
        fi

        attempt=$((attempt + 1))
        sleep 5
    done

    if [ $attempt -eq $max_attempts ]; then
        print_warning "Deployment monitoring timed out. Check service status manually:"
        echo "  docker stack services ${STACK_NAME}"
    fi
}

# Show deployment status
show_status() {
    print_status "Deployment Status:"
    echo ""

    print_status "Stack Services:"
    docker stack services "${STACK_NAME}"
    echo ""

    print_status "Service URLs:"
    echo "  🌐 Main App:      https://app.chatwell.pro"
    echo "  🔌 API:           https://api.chatwell.pro"
    echo "  🔐 Auth:          https://auth.chatwell.pro"
    echo "  📨 Webhooks:      https://hooks.chatwell.pro"
    echo "  📊 Status:        https://status.chatwell.pro"
    echo "  📚 API Docs:      https://docs.chatwell.pro"
    echo "  📁 CDN:           https://cdn.chatwell.pro"
    echo ""

    print_status "Health Check:"
    echo "  curl -s https://status.chatwell.pro/api/status | jq '.status'"
}

# Main execution
main() {
    print_status "Chatwell Pro Deployment Script"
    print_status "==============================="

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --tag)
                IMAGE_TAG="$2"
                shift 2
                ;;
            --email)
                ACME_EMAIL="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --tag TAG       Docker image tag to deploy (default: latest)"
                echo "  --email EMAIL   Email for Let's Encrypt certificates"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    print_status "Using image tag: ${IMAGE_TAG}"

    # Execute deployment steps
    check_swarm
    create_secrets
    create_networks
    deploy_stack
    monitor_deployment
    show_status

    print_success "🎉 Chatwell Pro deployment completed!"
    print_status "Access your application at: https://app.chatwell.pro"
}

# Run main function
main "$@"