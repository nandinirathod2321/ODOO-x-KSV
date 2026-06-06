#!/usr/bin/env bash
set -e

echo "============================================"
echo "  VendorBridge ERP - First-Time Setup"
echo "============================================"
echo ""

echo "[1/4] Setting up backend environment..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "      Created backend/.env from example."
else
    echo "      backend/.env already exists, skipping."
fi

echo ""
echo "[2/4] Installing backend dependencies..."
cd backend
npm install

echo ""
echo "[3/4] Creating database and pushing schema..."
npx prisma db push

echo ""
echo "[4/4] Seeding demo data..."
node prisma/seed.js
cd ..

echo ""
echo "[5/5] Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "============================================"
echo "  Setup complete! Run the app:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend && npm run dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd frontend && npm run dev"
echo ""
echo "  Then open: http://localhost:5173"
echo ""
echo "  Login:  admin@vendorbridge.com"
echo "  Pass:   admin123"
echo "============================================"
