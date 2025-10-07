#!/bin/bash

set -e

# Chatwell Pro - GitHub Repository Setup Script
echo "🚀 Setting up Chatwell Pro for GitHub..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Check if git is available
if ! command -v git &> /dev/null; then
    print_error "Git is required but not installed"
    exit 1
fi

print_status "Chatwell Pro GitHub Setup"
print_status "========================="

# Initialize git if not already done
if [ ! -d ".git" ]; then
    print_status "Initializing Git repository..."
    git init
    print_success "Git repository initialized"
else
    print_success "Git repository already exists"
fi

# Add all files
print_status "Adding files to Git..."
git add .

# Check if there are any changes to commit
if git diff --staged --quiet; then
    print_warning "No changes to commit"
else
    # Create initial commit
    print_status "Creating initial commit..."
    git commit -m "Initial commit: Chatwell Pro - Complete business management system

✅ Features implemented:
- Modern Next.js app with TypeScript & Tailwind
- Complete authentication system (login, register, email verification)
- Responsive dashboard with all modules
- Database schema for all business functions
- Docker & Docker Swarm ready
- Multi-service architecture for production
- Health checks and monitoring
- API documentation with Swagger
- Webhook handling for WhatsApp integration
- Ready for deployment with Portainer

🏗️ Production Architecture:
- app.chatwell.pro - Main application
- api.chatwell.pro - REST API
- auth.chatwell.pro - OAuth callbacks
- hooks.chatwell.pro - Webhook endpoints
- status.chatwell.pro - Health monitoring
- docs.chatwell.pro - API documentation
- cdn.chatwell.pro - Static files

🚀 Ready for immediate deployment!"

    print_success "Initial commit created"
fi

# Get repository URL
echo ""
print_status "GitHub Repository Setup"
echo "Please create a new repository on GitHub and provide the URL:"
echo "Example: https://github.com/username/chatwell-pro.git"
echo ""
read -p "Enter your GitHub repository URL: " repo_url

if [ -z "$repo_url" ]; then
    print_warning "No repository URL provided. You can add it later with:"
    echo "  git remote add origin YOUR_REPO_URL"
    echo "  git branch -M main"
    echo "  git push -u origin main"
else
    print_status "Adding GitHub remote..."

    # Remove existing origin if it exists
    git remote remove origin 2>/dev/null || true

    # Add new origin
    git remote add origin "$repo_url"

    # Rename branch to main
    git branch -M main

    # Push to GitHub
    print_status "Pushing to GitHub..."
    git push -u origin main

    print_success "Code pushed to GitHub!"
fi

echo ""
print_status "Next Steps:"
echo "1. 🔐 Configure GitHub Secrets for CI/CD:"
echo "   - Go to your repository → Settings → Secrets"
echo "   - Add any secrets needed for deployment"
echo ""
echo "2. 🏗️ Deploy to Production:"
echo "   - Clone this repo on your server"
echo "   - Run: ./deployment/scripts/create-secrets.sh"
echo "   - Run: ./deployment/scripts/deploy.sh"
echo ""
echo "3. 🌐 Configure DNS:"
echo "   - Point *.chatwell.pro to your server IP"
echo "   - Or configure individual subdomains"
echo ""
echo "4. 📊 Monitor deployment:"
echo "   - Check https://status.chatwell.pro after deployment"
echo ""

print_success "🎉 Chatwell Pro is ready for GitHub and production deployment!"
print_status "Repository: $repo_url"