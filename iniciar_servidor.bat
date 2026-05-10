@echo off
cd /d "%~dp0"

echo.
echo ================================================
echo   GodEyes Backend - Iniciar Servidor
echo ================================================
echo.

rem Testa py launcher primeiro
py -3 --version >nul 2>&1
if not errorlevel 1 goto use_py

rem Testa python
python --version >nul 2>&1
if not errorlevel 1 goto use_python

rem Procura Python em pastas comuns
if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" goto use_313
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" goto use_312
if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" goto use_311
if exist "%LOCALAPPDATA%\Programs\Python\Python310\python.exe" goto use_310
if exist "C:\Python313\python.exe" goto use_c313
if exist "C:\Python312\python.exe" goto use_c312
if exist "C:\Python311\python.exe" goto use_c311
if exist "C:\Python310\python.exe" goto use_c310

echo [ERRO] Python nao encontrado!
echo.
echo Instale Python em: https://www.python.org/downloads
echo IMPORTANTE: Marque "Add Python to PATH" durante instalacao.
echo Apos instalar, reinicie o PC e execute este arquivo novamente.
echo.
pause
exit /b

:use_py
set PY=py -3
goto install

:use_python
set PY=python
goto install

:use_313
set PY=%LOCALAPPDATA%\Programs\Python\Python313\python.exe
goto install

:use_312
set PY=%LOCALAPPDATA%\Programs\Python\Python312\python.exe
goto install

:use_311
set PY=%LOCALAPPDATA%\Programs\Python\Python311\python.exe
goto install

:use_310
set PY=%LOCALAPPDATA%\Programs\Python\Python310\python.exe
goto install

:use_c313
set PY=C:\Python313\python.exe
goto install

:use_c312
set PY=C:\Python312\python.exe
goto install

:use_c311
set PY=C:\Python311\python.exe
goto install

:use_c310
set PY=C:\Python310\python.exe
goto install

:install
echo [OK] Python encontrado.
%PY% --version
echo.

echo Verificando nmap...
nmap --version >nul 2>&1
if not errorlevel 1 echo [OK] nmap encontrado.
if errorlevel 1 echo [AVISO] nmap nao encontrado - instale em nmap.org para scan completo.
echo.

echo Instalando dependencias...
%PY% -m pip install flask flask-cors python-nmap requests paramiko dnspython python-whois
echo.

echo Iniciando servidor em http://localhost:5000
echo Pressione Ctrl+C para parar.
echo Abrindo GodEyes no navegador...
start "GodEyes" http://localhost:5000
echo.

%PY% "%~dp0server.py"

echo.
echo Servidor encerrado.
pause
