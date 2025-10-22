#!/bin/bash

# DataVault - New Authentication Flow Setup Script
# This script sets up all necessary database changes for the new auth flow

set -e

echo "🚀 Setting up DataVault New Authentication Flow..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if user is logged in to Supabase
print_status "Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    print_error "Please login to Supabase first:"
    echo "supabase login"
    exit 1
fi

print_success "Supabase authentication verified"

# Get project info
print_status "Getting project information..."
PROJECT_INFO=$(supabase projects list --format json 2>/dev/null | jq -r '.[0] // empty')

if [ -z "$PROJECT_INFO" ]; then
    print_error "No Supabase project found. Please create a project first."
    exit 1
fi

PROJECT_ID=$(echo $PROJECT_INFO | jq -r '.id')
PROJECT_NAME=$(echo $PROJECT_INFO | jq -r '.name')

print_success "Using project: $PROJECT_NAME ($PROJECT_ID)"

# Function to execute SQL file
execute_sql() {
    local file=$1
    local description=$2

    print_status "Executing: $description"

    if [ ! -f "$file" ]; then
        print_error "SQL file not found: $file"
        return 1
    fi

    if supabase db push --file "$file" --dry-run &> /dev/null; then
        print_warning "Dry run successful for $file"
        read -p "Do you want to apply this migration? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if supabase db push --file "$file"; then
                print_success "✅ Applied: $description"
            else
                print_error "❌ Failed to apply: $description"
                return 1
            fi
        else
            print_warning "⏭️ Skipped: $description"
        fi
    else
        print_error "❌ Dry run failed for $file"
        return 1
    fi
}

# Execute migrations in order
echo
print_status "Starting database migrations..."
echo "=================================="

# 1. Create tables (if not exists)
execute_sql "scripts/001_create_tables.sql" "Create base tables"

# 2. Create triggers (if not exists)
execute_sql "scripts/002_create_triggers.sql" "Create authentication triggers"

# 3. Add location field
execute_sql "scripts/007_add_location_field.sql" "Add location field to profiles"

# 4. Setup storage for avatars
execute_sql "scripts/006_setup_storage.sql" "Setup avatar storage"

# 5. Verify triggers
execute_sql "scripts/004_verify_triggers.sql" "Verify trigger installation"

# 6. Fix any missing profiles
execute_sql "scripts/005_manual_profile_fix.sql" "Fix missing profiles"

echo
print_status "Database migrations completed!"
echo "=================================="

# Verify setup
print_status "Verifying setup..."

# Check if tables exist
TABLES=$(supabase db shell --command "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('profiles', 'bounties', 'submissions', 'datasets', 'purchases');" 2>/dev/null | grep -E "(profiles|bounties|submissions|datasets|purchases)" | wc -l)

if [ "$TABLES" -eq "5" ]; then
    print_success "✅ All required tables exist"
else
    print_warning "⚠️ Some tables may be missing"
fi

# Check if storage bucket exists
BUCKET_EXISTS=$(supabase storage list 2>/dev/null | grep -c "avatars" || echo "0")

if [ "$BUCKET_EXISTS" -gt "0" ]; then
    print_success "✅ Avatar storage bucket exists"
else
    print_warning "⚠️ Avatar storage bucket may be missing"
fi

# Check user profile count
PROFILE_COUNT=$(supabase db shell --command "SELECT COUNT(*) FROM auth.users LEFT JOIN public.profiles ON auth.users.id = public.profiles.id WHERE public.profiles.id IS NULL;" 2>/dev/null | grep -E "^[0-9]+$" || echo "unknown")

if [ "$PROFILE_COUNT" = "0" ]; then
    print_success "✅ All users have profiles"
else
    print_warning "⚠️ $PROFILE_COUNT users without profiles"
fi

echo
print_success "🎉 New authentication flow setup completed!"
echo "=================================================="

echo
print_status "Next steps:"
echo "1. Test the sign-up flow at /auth/sign-up"
echo "2. Test the sign-in flow at /auth/login"
echo "3. Verify profile management at /profile"
echo "4. Test wallet linking in profile settings"
echo "5. Check dashboard functionality at /dashboard"

echo
print_status "Debug tools:"
echo "- Visit /api/debug to check auth status"
echo "- Check browser console for any errors"
echo "- Review Supabase logs for debugging"

echo
print_status "Environment variables to verify:"
echo "- NEXT_PUBLIC_SUPABASE_URL"
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "- NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL"

echo
print_success "Setup complete! 🚀"
