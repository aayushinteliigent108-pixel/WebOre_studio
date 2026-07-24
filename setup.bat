@echo off
echo ========================================
echo   Webore — Fresh Project Setup
echo ========================================
echo.

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)

echo [1/6] Initializing project...
npm init -y >nul 2>&1

echo [2/6] Installing dependencies...
npm install express prisma @prisma/client bcryptjs jsonwebtoken passport passport-google-oauth20 passport-facebook passport-github2 express-session cookie-parser cors helmet compression express-rate-limit dotenv uuid node-fetch multer >nul 2>&1

echo [3/6] Installing dev dependencies...
npm install --save-dev nodemon >nul 2>&1

echo [4/6] Creating folder structure...
mkdir server\routes 2>nul
mkdir server\prisma 2>nul
mkdir public\css 2>nul
mkdir public\js 2>nul
mkdir public\assets\icons 2>nul

echo [5/6] Generating Prisma client...
npx prisma generate --schema server\prisma\schema.prisma >nul 2>&1

echo [6/6] Pushing database schema...
npx prisma db push --schema server\prisma\schema.prisma >nul 2>&1

echo.
echo ========================================
echo   Setup complete!
echo ========================================
echo.
echo Next steps:
echo   1. Copy all source files into this folder
echo   2. Copy .env.example to .env and add your API keys
echo   3. Run: npm run db:seed
echo   4. Run: npm start
echo   5. Open: http://localhost:4000
echo.
pause
