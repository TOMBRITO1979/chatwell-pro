#!/bin/bash

set -e

# Chatwell Pro Secrets Creation Script
echo "🔐 Creating Docker Secrets for Chatwell Pro..."

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

# Generate a random secret
generate_secret() {
    openssl rand -base64 32
}

# Create a Docker secret
create_secret() {
    local name=$1
    local value=$2
    local description=$3

    if docker secret ls --format "{{.Name}}" | grep -q "^${name}$"; then
        print_warning "Secret '${name}' already exists. Skipping..."
        return 0
    fi

    if [ -z "$value" ]; then
        print_error "No value provided for secret '${name}'"
        return 1
    fi

    echo "$value" | docker secret create "$name" -
    print_success "Created secret: ${name} (${description})"
}

# Prompt for secret value
prompt_secret() {
    local name=$1
    local description=$2
    local default_value=$3

    echo -e "${BLUE}Enter value for ${name}${NC} (${description}):"
    if [ -n "$default_value" ]; then
        echo "Press Enter to use generated value, or type your own:"
    fi

    read -s value

    if [ -z "$value" ] && [ -n "$default_value" ]; then
        value="$default_value"
    fi

    if [ -z "$value" ]; then
        print_error "No value provided for ${name}"
        return 1
    fi

    echo "$value"
}

# Main function
main() {
    print_status "Chatwell Pro Secrets Setup"
    print_status "=========================="
    print_warning "This script will create Docker secrets for your Chatwell Pro deployment."
    print_warning "Make sure you're running this on the Docker Swarm manager node."
    echo ""

    # Check if Docker Swarm is active
    if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q active; then
        print_error "Docker Swarm is not active. Please initialize swarm first:"
        echo "  docker swarm init"
        exit 1
    fi

    echo "Press Enter to continue or Ctrl+C to cancel..."
    read

    # Database password
    print_status "Setting up database password..."
    db_password=$(prompt_secret "db_password" "PostgreSQL database password" "$(generate_secret)")
    create_secret "db_password" "$db_password" "PostgreSQL database password"

    # JWT Secret
    print_status "Setting up JWT secret..."
    jwt_secret=$(prompt_secret "jwt_secret" "JWT signing secret" "$(generate_secret)")
    create_secret "jwt_secret" "$jwt_secret" "JWT token signing secret"

    # Google Client Secret
    print_status "Setting up Google OAuth client secret..."
    echo "Get this from Google Cloud Console (APIs & Services > Credentials)"
    google_secret=$(prompt_secret "google_client_secret" "Google OAuth client secret" "")
    create_secret "google_client_secret" "$google_secret" "Google OAuth client secret"

    # Email password
    print_status "Setting up email password..."
    echo "Use an app-specific password for Gmail or your email provider's password"
    email_password=$(prompt_secret "email_password" "Email service password/app password" "")
    create_secret "email_password" "$email_password" "Email service authentication"

    # WAHA API Key
    print_status "Setting up WAHA API key..."
    echo "Get this from your WAHA WhatsApp API instance"
    waha_key=$(prompt_secret "waha_api_key" "WAHA WhatsApp API key" "$(generate_secret)")
    create_secret "waha_api_key" "$waha_key" "WAHA WhatsApp API authentication"

    print_success "🎉 All secrets created successfully!"
    echo ""
    print_status "Created secrets:"
    docker secret ls --format "table {{.Name}}\t{{.CreatedAt}}" | grep -E "(NAME|db_password|jwt_secret|google_client_secret|email_password|waha_api_key)"
    echo ""
    print_status "You can now proceed with the deployment:"
    print_status "  ./deployment/scripts/deploy.sh"
}

# Check if required tools are available
check_requirements() {
    if ! command -v openssl &> /dev/null; then
        print_error "openssl is required but not installed."
        exit 1
    fi

    if ! command -v docker &> /dev/null; then
        print_error "docker is required but not installed."
        exit 1
    fi
}

# Run the script
check_requirements
main "$@"