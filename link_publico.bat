@echo off
title GodEyes - Link Publico Externo
color 0A

echo =======================================================
echo   GodEyes - Gerador de Link Publico (tunelamento seguro)
echo =======================================================
echo.
echo Conectando ao servidor... Aguarde.
echo.
echo [!] O SEU LINK APARECERA ABAIXO! Procure pela linha que comeca com "https://" e termina com "lhr.life"
echo [!] Copie esse link para acessar o painel do seu Celular!
echo [!] MANTENHA ESTA JANELA ABERTA para manter o link no ar.
echo.

:: O comando SSH cria um túnel reverso.
ssh -o StrictHostKeyChecking=no -R 80:localhost:5000 nokey@localhost.run

echo.
echo Servidor de tunelamento desconectado.
pause
