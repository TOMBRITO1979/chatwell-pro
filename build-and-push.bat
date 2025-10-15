@echo off
echo ============================================
echo Building Docker Image with Super Admin
echo ============================================

REM Gerar timestamp para tag
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%-%datetime:~8,6%

echo Timestamp: %TIMESTAMP%

REM Build da imagem com múltiplas tags
echo.
echo Building image...
docker build -t tomautomations/chatwell-pro:latest ^
             -t tomautomations/chatwell-pro:super-admin ^
             -t tomautomations/chatwell-pro:%TIMESTAMP% .

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo ============================================
echo Build completed successfully!
echo ============================================
echo.
echo Tags created:
echo - tomautomations/chatwell-pro:latest
echo - tomautomations/chatwell-pro:super-admin
echo - tomautomations/chatwell-pro:%TIMESTAMP%
echo.

REM Perguntar se quer fazer push
set /p PUSH="Push to Docker Hub? (y/n): "
if /i "%PUSH%" NEQ "y" (
    echo.
    echo Push cancelled. You can push later with:
    echo docker push tomautomations/chatwell-pro:latest
    echo docker push tomautomations/chatwell-pro:super-admin
    echo docker push tomautomations/chatwell-pro:%TIMESTAMP%
    pause
    exit /b 0
)

echo.
echo Pushing images to Docker Hub...
echo.

docker push tomautomations/chatwell-pro:latest
docker push tomautomations/chatwell-pro:super-admin
docker push tomautomations/chatwell-pro:%TIMESTAMP%

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Push failed! Make sure you are logged in:
    echo docker login
    pause
    exit /b 1
)

echo.
echo ============================================
echo Images pushed successfully!
echo ============================================
echo.
echo You can now update your stack with:
echo - tomautomations/chatwell-pro:latest
echo - tomautomations/chatwell-pro:%TIMESTAMP%
echo.
echo Don't forget to run the migration:
echo docker exec -it ^<container_id^> npm run super-admin:setup
echo.
pause
