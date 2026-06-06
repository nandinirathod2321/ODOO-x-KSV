@echo off
echo ============================================
echo   VendorBridge ERP - First-Time Setup
echo ============================================
echo.

echo [1/4] Setting up backend environment...
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env"
    echo      Created backend\.env from example.
) else (
    echo      backend\.env already exists, skipping.
)

echo.
echo [2/4] Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 goto error

echo.
echo [3/4] Creating database and pushing schema...
call npx prisma db push
if errorlevel 1 goto error

echo.
echo [4/4] Seeding demo data...
call node prisma/seed.js
if errorlevel 1 goto error
cd ..

echo.
echo [5/5] Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 goto error
cd ..

echo.
echo ============================================
echo   Setup complete! Run the app:
echo.
echo   Terminal 1 (Backend):
echo     cd backend ^&^& npm run dev
echo.
echo   Terminal 2 (Frontend):
echo     cd frontend ^&^& npm run dev
echo.
echo   Then open: http://localhost:5173
echo.
echo   Login:  admin@vendorbridge.com
echo   Pass:   admin123
echo ============================================
goto end

:error
echo.
echo ERROR: Setup failed. Check the output above.
exit /b 1

:end
