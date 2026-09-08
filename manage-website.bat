@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title Website Manager - Ashraf and Khaled Accounting Office

rem ============================================================
rem   WEBSITE MANAGER  -  one-click tool for non-coders
rem
rem   How to use: put this file in the website folder
rem   (it is already there) and double-click it.
rem   Everything the tool does is written to
rem   website-tool-log.txt in the same folder.
rem
rem   No coding knowledge is needed. Just type numbers
rem   and press ENTER.
rem ============================================================

rem --- go to the folder where this file lives ---
cd /d "%~dp0"

set "LOGFILE=%~dp0website-tool-log.txt"
if not exist "%LOGFILE%" echo === Website Manager log === > "%LOGFILE%"

rem --- basic requirements ---
where node >nul 2>nul || goto :missing_node
where git >nul 2>nul || goto :missing_git

rem =========================== MENU ===========================
:menu
cls
echo ============================================================
echo                    WEBSITE  MANAGER
echo ============================================================
echo.
echo    What do you want to do?
echo.
echo     [1]  Preview the website on this computer
echo     [2]  Save and upload my changes to GitHub
echo     [3]  Publish the website live (Cloudflare)
echo     [4]  Show my accounts and website status
echo     [5]  Open the log file (history of everything)
echo     [6]  Help - what do these options mean?
echo     [7]  Turn off local websites running on this computer
echo     [8]  Log out of everything (GitHub and Cloudflare)
echo.
echo     [0]  Exit
echo.
set "ANS="
set /p "ANS=Type a number and press ENTER: "
if "%ANS%"=="1" goto :preview
if "%ANS%"=="2" goto :github
if "%ANS%"=="3" goto :cloudflare
if "%ANS%"=="4" goto :status
if "%ANS%"=="5" goto :openlog
if "%ANS%"=="6" goto :help
if "%ANS%"=="7" goto :stop_all
if "%ANS%"=="8" goto :logout_all
if "%ANS%"=="0" goto :end
goto :menu

rem ==================== 1. LOCAL PREVIEW ======================
:preview
cls
echo ------------------------------------------------------------
echo             PREVIEW THE WEBSITE ON THIS COMPUTER
echo ------------------------------------------------------------
echo.
call :log "Preview: option started"
netstat -ano 2>nul | findstr /C:":3000 " | findstr /C:"LISTENING" >nul
if not errorlevel 1 goto :preview_already_running

echo Starting the website preview...
echo A second window will open - that is normal. The first page
echo may take a little moment to appear.
echo.
start "Website Preview - keep this window open" cmd /k "call npm run dev"
echo Waiting about 10 seconds, then the website will open in your browser...
timeout /t 10 /nobreak >nul
start "" "http://localhost:3000"
echo.
echo Done! The website preview is at:  http://localhost:3000
echo TIP: to stop the preview later, close the window called
echo      "Website Preview".
call :log "Preview: started new dev server on port 3000 and opened the browser"
goto :pause_menu

:preview_already_running
echo The website preview is ALREADY running on this computer.
start "" "http://localhost:3000"
echo The website was opened in your browser:  http://localhost:3000
call :log "Preview: server already running, opened the browser"
goto :pause_menu

rem ==================== 2. GITHUB =============================
:github
cls
echo ------------------------------------------------------------
echo               SAVE AND UPLOAD MY CHANGES
echo                    ( G I T H U B )
echo ------------------------------------------------------------
echo.
call :log "GitHub: option started"
where gh >nul 2>nul || goto :gh_missing

rem ---- who is logged in to GitHub? ----
set "GH_USER="
gh api user --jq .login >nul 2>&1
if errorlevel 1 goto :gh_not_logged_in
for /f "delims=" %%U in ('gh api user --jq .login 2^>^&1') do set "GH_USER=%%U"
call :log "GitHub: currently logged in as %GH_USER%"
echo You are connected to GitHub as:  %GH_USER%
echo.
echo   [1]  Yes, continue with this account
echo   [2]  Use a different GitHub account (re-login)
echo   [3]  Cancel
echo.
set "ANS="
set /p "ANS=Choose and press ENTER [1]: "
if "%ANS%"=="2" goto :gh_relogin
if "%ANS%"=="3" goto :menu
goto :gh_repo

:gh_not_logged_in
echo You are NOT connected to GitHub yet.
echo.
echo   [1]  Connect now (opens GitHub in your browser)
echo   [2]  Cancel
echo.
set "ANS="
set /p "ANS=Choose and press ENTER [1]: "
if "%ANS%"=="2" goto :menu
goto :gh_relogin

:gh_relogin
echo.
echo Step 1: signing out of the current account (if any)...
gh auth logout --hostname github.com
echo Step 2: connecting to GitHub...
echo A browser window will open. Follow the steps on the GitHub
echo website. If a code is shown in this window, type it into
echo the GitHub website page.
echo.
gh auth login --hostname github.com --git-protocol https --web
set "GH_USER="
gh api user --jq .login >nul 2>&1
if errorlevel 1 (
    echo.
    echo The login did not finish. You can try again later.
    call :log "GitHub: re-login did not finish"
    goto :pause_menu
)
for /f "delims=" %%U in ('gh api user --jq .login 2^>^&1') do set "GH_USER=%%U"
echo.
echo Now connected to GitHub as:  %GH_USER%
call :log "GitHub: logged in as %GH_USER%"

rem ---- is there a GitHub repository linked to this website? ----
:gh_repo
gh auth setup-git >nul 2>&1
set "GH_REMOTE="
git remote get-url github >nul 2>&1
if not errorlevel 1 (
    set "GH_REMOTE=github"
    goto :gh_ready
)
for /f "tokens=1" %%R in ('git remote -v 2^>nul ^| findstr /I /C:"github.com" ^| findstr /C:"(push)"') do (
    set "GH_REMOTE=%%R"
    goto :gh_ready
)
goto :gh_no_repo

:gh_no_repo
echo.
echo There is NO GitHub repository linked to this website yet.
echo GitHub is the place where your website code is saved online.
echo.
set "ANS="
set /p "ANS=Create a new GitHub repository now? Type Y or N and press ENTER [Y]: "
if /I "%ANS%"=="N" goto :menu
echo.
set "FOLDER="
for %%D in ("%~dp0.") do set "FOLDER=%%~nxD"
set "REPONAME="
set /p "REPONAME=Repository name (press ENTER to use: %FOLDER%): "
if "%REPONAME%"=="" set "REPONAME=%FOLDER%"
call :clean REPONAME
if not defined REPONAME set "REPONAME=%FOLDER%"
echo.
echo   [1]  Public   - anyone can see the website code
echo   [2]  Private  - only you can see the code
echo.
set "ANS="
set /p "ANS=Choose and press ENTER [1]: "
set "VIS=public"
if "%ANS%"=="2" set "VIS=private"
echo.
echo Creating the repository "%REPONAME%" (%VIS%) on GitHub...
call :log "GitHub: creating repository %REPONAME% (%VIS%)"
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 git init >nul 2>&1
gh repo create "%REPONAME%" --%VIS% --source . --remote github >nul 2>&1
if errorlevel 1 (
    echo.
    echo The repository could not be created. The name may already
    echo be taken, or the internet connection dropped.
    echo Try option 2 again with a different name.
    call :log "GitHub: repository creation FAILED"
    goto :pause_menu
)
set "GH_REMOTE=github"
echo Repository created successfully.
call :log "GitHub: repository %REPONAME% created"

rem ---- save the user's changes and upload ----
:gh_ready
set "BRANCH="
for /f "delims=" %%B in ('git branch --show-current 2^>^&1') do set "BRANCH=%%B"
if "%BRANCH%"=="" set "BRANCH=main"
echo.
echo ------------------  SAVING YOUR CHANGES  ------------------
echo.
set "DESC="
set /p "DESC=Write a short description of what you changed (press ENTER for: Website update): "
if "%DESC%"=="" set "DESC=Website update"
call :clean DESC
if not defined DESC set "DESC=Website update"
call :log "GitHub: change description: %DESC%"
git add -A
git commit -m "%DESC%" >nul 2>&1
if errorlevel 1 (
    echo There are no new changes to save since the last time.
) else (
    echo Your changes were saved:  "%DESC%"
    call :log "GitHub: changes committed locally"
)
echo.
echo ------------------  UPLOADING TO GITHUB  ------------------
echo Repository: %GH_REMOTE%      Branch: %BRANCH%
echo Please wait...
git push -u %GH_REMOTE% %BRANCH% > "%TEMP%\gh_push.txt" 2>&1
if errorlevel 1 goto :gh_push_failed
echo.
echo Uploaded successfully!
call :log "GitHub: pushed branch %BRANCH% to %GH_REMOTE% - OK"
goto :gh_after

:gh_push_failed
echo.
echo The upload did NOT work. This is the error message:
echo.
type "%TEMP%\gh_push.txt"
echo.
echo If it says "access denied" or "403", the logged-in GitHub
echo account may not have permission for this repository.
echo Choose option 2 again and re-login with the correct account.
call :log "GitHub: push FAILED"
goto :pause_menu

rem ---- extra services after a successful upload ----
:gh_after
echo.
echo  Anything else you want to do?
echo.
echo   [1]  Open my repository page on github.com
echo   [2]  Also upload to my other services (GitLab)
echo   [3]  Back to the main menu
echo.
set "ANS="
set /p "ANS=Choose and press ENTER [3]: "
if "%ANS%"=="1" goto :gh_open_repo
if "%ANS%"=="2" goto :push_others
goto :menu

:gh_open_repo
set "REPOSLUG="
for /f "delims=" %%S in ('gh repo view --json nameWithOwner --jq .nameWithOwner 2^>^&1') do set "REPOSLUG=%%S"
if "%REPOSLUG%"=="" (
    echo Could not find the repository address.
    call :log "GitHub: could not detect repository address"
    goto :pause_menu
)
start "" "https://github.com/%REPOSLUG%"
call :log "GitHub: opened repository page %REPOSLUG%"
goto :pause_menu

:push_others
echo.
echo Uploading to your other services...
set "BRANCH="
for /f "delims=" %%B in ('git branch --show-current 2^>^&1') do set "BRANCH=%%B"
if "%BRANCH%"=="" set "BRANCH=main"
for /f "tokens=1" %%R in ('git remote 2^>nul ^| findstr /V /I /C:"%GH_REMOTE%"') do (
    echo   Uploading to "%%R"...
    git push "%%R" %BRANCH% > "%TEMP%\push_other.txt" 2>&1
    if errorlevel 1 (
        echo     Could not upload to "%%R".
        call :log "Upload to %%R: FAILED"
    ) else (
        echo     Done.
        call :log "Upload to %%R: OK"
    )
)
echo.
echo Finished with the other services.
goto :pause_menu

rem ==================== 3. CLOUDFLARE =========================
:cloudflare
cls
echo ------------------------------------------------------------
echo             PUBLISH THE WEBSITE LIVE
echo                  ( C L O U D F L A R E )
echo ------------------------------------------------------------
echo.
call :log "Cloudflare: option started"

rem ---- who is logged in to Cloudflare? ----
set "CF_EMAIL="
call npx wrangler whoami > "%TEMP%\cf_who.txt" 2>&1
for /f "usebackq delims=" %%E in (`powershell -NoProfile -Command "$m = Select-String -Path '%TEMP%\cf_who.txt' -Pattern 'the email (\S+?)\.'; if ($m) { $m.Matches[0].Groups[1].Value }"`) do set "CF_EMAIL=%%E"
if not defined CF_EMAIL goto :cf_not_logged_in
echo You are connected to Cloudflare with the email:  %CF_EMAIL%
echo.
echo   [1]  Yes, continue with this account
echo   [2]  Use a different Cloudflare account (re-login)
echo   [3]  Cancel
echo.
set "ANS="
set /p "ANS=Choose and press ENTER [1]: "
if "%ANS%"=="2" goto :cf_relogin
if "%ANS%"=="3" goto :menu
goto :cf_menu

:cf_not_logged_in
echo You are NOT connected to Cloudflare yet.
echo.
echo   [1]  Connect now (opens Cloudflare in your browser)
echo   [2]  Cancel
echo.
set "ANS="
set /p "ANS=Choose and press ENTER [1]: "
if "%ANS%"=="2" goto :menu
goto :cf_relogin

:cf_relogin
echo.
echo Signing out of the current account (if any)...
call npx wrangler logout >nul 2>&1
echo Connecting to Cloudflare...
echo A browser window will open. Log in with your Cloudflare
email and password, then click the "Allow" button.
echo.
call npx wrangler login
set "CF_EMAIL="
call npx wrangler whoami > "%TEMP%\cf_who.txt" 2>&1
for /f "usebackq delims=" %%E in (`powershell -NoProfile -Command "$m = Select-String -Path '%TEMP%\cf_who.txt' -Pattern 'the email (\S+?)\.'; if ($m) { $m.Matches[0].Groups[1].Value }"`) do set "CF_EMAIL=%%E"
if not defined CF_EMAIL (
    echo.
    echo The login did not finish. You can try again later.
    call :log "Cloudflare: login did not finish"
    goto :pause_menu
)
echo.
echo Now connected to Cloudflare with the email:  %CF_EMAIL%
call :log "Cloudflare: logged in as %CF_EMAIL%"

:cf_menu
echo.
echo   What do you want to do with Cloudflare?
echo.
echo   [1]  Build the website and put it LIVE (a few minutes)
echo   [2]  Test the live version on this computer first
echo   [3]  Back to the main menu
echo.
set "ANS="
set /p "ANS=Choose and press ENTER [3]: "
if "%ANS%"=="1" goto :cf_deploy
if "%ANS%"=="2" goto :cf_preview
goto :menu

:cf_deploy
echo.
echo Building the website and uploading it to Cloudflare...
echo This usually takes 2 to 5 minutes.
echo IMPORTANT: please do not close this window while it works.
echo.
call :log "Cloudflare: build and deploy started"
call npm run deploy > "%TEMP%\cf_deploy.txt" 2>&1
if errorlevel 1 goto :cf_deploy_failed
call :log "Cloudflare: deploy finished - OK"
echo.
echo The website was published LIVE successfully!
echo.
echo Last messages from Cloudflare:
powershell -NoProfile -Command "Get-Content -Tail 8 '%TEMP%\cf_deploy.txt'"
set "LIVE_URL="
for /f "usebackq delims=" %%U in (`powershell -NoProfile -Command "$m = Select-String -Path '%TEMP%\cf_deploy.txt' -Pattern 'https://\S+workers\.dev' -AllMatches; if ($m) { $m.Matches | ForEach-Object { $_.Value } }"`) do set "LIVE_URL=%%U"
if not defined LIVE_URL goto :cf_deploy_done
echo.
echo Your live website address:  %LIVE_URL%
call :log "Cloudflare: live address %LIVE_URL%"
set "ANS="
set /p "ANS=Open it in the browser now? Type Y or N and press ENTER [Y]: "
if /I "%ANS%"=="N" goto :cf_deploy_done
start "" "%LIVE_URL%"
:cf_deploy_done
goto :pause_menu

:cf_deploy_failed
call :log "Cloudflare: deploy FAILED"
echo.
echo Unfortunately the upload did NOT work.
echo Here are the last messages (the full report is in the log):
echo.
powershell -NoProfile -Command "Get-Content -Tail 15 '%TEMP%\cf_deploy.txt'"
goto :pause_menu

:cf_preview
echo.
echo This starts the REAL live version of the website on this
echo computer - without publishing it to the world.
echo A second window will open. It needs about a minute to get
echo ready. When the website opens, you can close that window
echo to stop the test.
echo.
start "Cloudflare Test - close this window to stop" cmd /k "call npm run preview"
echo Waiting about 25 seconds, then opening the test address...
timeout /t 25 /nobreak >nul
start "" "http://localhost:8788"
echo.
echo The test website was opened at:  http://localhost:8788
echo If it shows an error, wait a little and refresh the page -
echo the test server may still be waking up.
call :log "Cloudflare: local live-test started on port 8788"
goto :pause_menu

rem ==================== 4. STATUS =============================
:status
cls
echo ------------------------------------------------------------
echo            MY ACCOUNTS AND WEBSITE STATUS
echo ------------------------------------------------------------
echo.
echo  GitHub:
where gh >nul 2>nul || goto :status_gh_missing
gh api user --jq .login >nul 2>&1
if errorlevel 1 goto :status_gh_offline
for /f "delims=" %%U in ('gh api user --jq .login 2^>^&1') do echo     connected as:  %%U
goto :status_cf
:status_gh_missing
echo     the GitHub tool is not installed
goto :status_cf
:status_gh_offline
echo     not connected
:status_cf
echo.
echo  Cloudflare:
set "CF_EMAIL="
call npx wrangler whoami > "%TEMP%\cf_who.txt" 2>&1
for /f "usebackq delims=" %%E in (`powershell -NoProfile -Command "$m = Select-String -Path '%TEMP%\cf_who.txt' -Pattern 'the email (\S+?)\.'; if ($m) { $m.Matches[0].Groups[1].Value }"`) do set "CF_EMAIL=%%E"
if defined CF_EMAIL (
    echo     connected as:  %CF_EMAIL%
) else (
    echo     not connected
)
echo.
echo  Website project:
set "BRANCH="
for /f "delims=" %%B in ('git branch --show-current 2^>^&1') do set "BRANCH=%%B"
if "%BRANCH%"=="" set "BRANCH=unknown"
echo     current branch:  %BRANCH%
set "CHCOUNT=0"
for /f %%A in ('git status --porcelain 2^>nul ^| find /c /v ""') do set "CHCOUNT=%%A"
echo     files with unsaved changes:  %CHCOUNT%
echo.
echo     online services linked to this website:
git remote -v
echo.
call :log "Status: checked accounts and website status"
goto :pause_menu

rem ==================== 5. LOG FILE ===========================
:openlog
call :log "Log file opened"
start "" notepad "%LOGFILE%"
goto :menu

rem ==================== 6. HELP ================================
:help
cls
echo ------------------------------------------------------------
echo                         HELP
echo ------------------------------------------------------------
echo.
echo  This tool manages your accounting-office website.
echo  You never need to open any code. Just type numbers.
echo.
echo  [1] Preview - starts the website on YOUR computer only.
echo      Nobody on the internet can see it. Good for checking
echo      how the website looks before publishing.
echo.
echo  [2] GitHub - GitHub is the safe place where the website
echo      code is stored online. Choose this after you (or your
echo      programmer) changed something and you want to save it.
echo      The tool will show you which GitHub account is active
echo      and you can continue with it or log in with another
echo      account. If no GitHub repository exists yet, the tool
echo      offers to create one for you.
echo      The short description you type is saved in the log
echo      file together with everything else the tool does.
echo.
echo  [3] Cloudflare - Cloudflare is the company that runs your
echo      LIVE website on the internet. Choose this to publish
echo      the newest version of the website for everyone.
echo      The tool will show you which Cloudflare account is
echo      active and you can continue with it or log in with
echo      another account. Publishing takes 2 to 5 minutes.
echo.
echo  [4] Status - shows which accounts are connected and how
echo      many changes are not yet uploaded.
echo.
echo  [5] Log - opens website-tool-log.txt. It remembers every
echo      action this tool performed, with dates. You can edit
echo      or delete this file any time - it is yours.
echo.
echo  [7] Turn off - stops every preview and test website that
echo      is running on this computer. It does NOT touch your
echo      LIVE website on the internet.
echo.
echo  [8] Log out - signs this computer out of GitHub and
echo      Cloudflare. Nothing is deleted, and you can log back
echo      in any time with any account using options 2 and 3.
echo.
echo  ABOUT THIS TOOL: manage-website.bat is a plain text file.
echo  You can open it with Notepad and change anything - the
echo  words, the questions, the timing. When you use option 2,
echo  this file is uploaded together with the website code, so
echo  you always have a backup copy of the tool on GitHub.
echo.
echo  If something fails, open the log file (option 5) - it says
echo  exactly what happened. Keep it when you ask for help.
echo.
call :log "Help: help screen shown"
goto :pause_menu

rem ==================== 7. STOP LOCAL SITES ===================
:stop_all
cls
echo ------------------------------------------------------------
echo        TURN OFF LOCAL WEBSITES RUNNING ON THIS PC
echo ------------------------------------------------------------
echo.
call :log "Stop: option started"
echo Looking for preview windows started by this tool...
tasklist /FI "WINDOWTITLE eq Website Preview - keep this window open*" 2>nul | findstr /I /C:"cmd.exe" >nul && (
    echo   Closing the website preview window...
    taskkill /FI "WINDOWTITLE eq Website Preview - keep this window open*" /T /F >nul 2>&1
    call :log "Stop: closed the website preview window"
)
tasklist /FI "WINDOWTITLE eq Cloudflare Test - close this window to stop*" 2>nul | findstr /I /C:"cmd.exe" >nul && (
    echo   Closing the Cloudflare test window...
    taskkill /FI "WINDOWTITLE eq Cloudflare Test - close this window to stop*" /T /F >nul 2>&1
    call :log "Stop: closed the Cloudflare test window"
)
echo.
echo Checking the website ports this project can use...
call :stop_port 3000
call :stop_port 3111
call :stop_port 8787
call :stop_port 8788
call :stop_port 8789
echo.
echo All website previews and tests on this computer are now
echo turned off. Your LIVE website is NOT affected by this.
echo If a black window is still open somewhere, just close it.
call :log "Stop: finished"
goto :pause_menu

:stop_port
rem %1 = port number. Turns off a website server listening on it,
rem but only when it is a "node.exe" process - any other program
rem using that port is left completely alone.
for /f "tokens=5" %%P in ('netstat -ano 2^>nul ^| findstr /C:":%~1 " ^| findstr /C:"LISTENING"') do (
    tasklist /FI "PID eq %%P" 2>nul | find /I "node.exe" >nul && (
        echo   Found a running website server on port %~1 - turning it off...
        taskkill /PID %%P /T /F >nul 2>&1
        call :log "Stop: closed the server on port %~1"
    )
)
goto :eof

rem ==================== 8. LOGOUT EVERYWHERE ===================
:logout_all
cls
echo ------------------------------------------------------------
echo              LOG OUT OF EVERYTHING
echo            ( GitHub and Cloudflare )
echo ------------------------------------------------------------
echo.
call :log "Logout: option started"
echo You are about to sign out of GitHub and Cloudflare on this
echo computer. Nothing will be deleted from the internet.
echo You can log in again any time with the same account or a
echo different one.
echo.
set "ANS="
set /p "ANS=Really log out of everything? Type Y or N and press ENTER [N]: "
if /I not "%ANS%"=="Y" (
    echo Cancelled. Nothing was changed.
    call :log "Logout: cancelled by the user"
    goto :pause_menu
)
echo.
echo Signing out of GitHub...
where gh >nul 2>nul
if not errorlevel 1 (
    gh auth logout --hostname github.com
    call :log "Logout: signed out of GitHub"
) else (
    echo   The GitHub tool is not installed - nothing to sign out of.
    call :log "Logout: GitHub tool not installed"
)
echo Signing out of Cloudflare...
call npx wrangler logout >nul 2>&1
call :log "Logout: signed out of Cloudflare"
echo.
echo Done. This computer is now signed out of GitHub and
echo Cloudflare. The saved code and the LIVE website are safe.
echo.
echo If you have more than one GitHub account saved, it may ask
echo you which one to sign out - run this option again until it
echo says there is no GitHub account.
echo.
echo To log in again later, choose option 2 for GitHub or
echo option 3 for Cloudflare. You can log in with ANY account
echo you like - old or new.
call :log "Logout: finished"
goto :pause_menu

rem ==================== MISSING TOOLS =========================
:missing_node
cls
echo This tool needs "Node.js" on the computer, but it was not found.
echo.
echo Please install it from:  https://nodejs.org
echo Choose the LTS version, then open this tool again.
echo.
call :log "Blocked: Node.js is not installed"
goto :pause_menu

:missing_git
cls
echo This tool needs "Git" on the computer, but it was not found.
echo.
echo Please install it from:  https://git-scm.com
echo Then open this tool again.
echo.
call :log "Blocked: Git is not installed"
goto :pause_menu

:gh_missing
cls
echo The GitHub tool ("GitHub CLI") is not installed on this computer.
echo It is needed to save and upload your website code.
echo.
set "ANS="
set /p "ANS=Install it automatically now? Type Y or N and press ENTER [Y]: "
if /I "%ANS%"=="N" goto :pause_menu
echo.
echo Installing (this takes a minute, please wait)...
call winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements
if errorlevel 1 (
    echo.
    echo The automatic install did not work.
    echo Please download it from:  https://cli.github.com
    echo Then open this tool again.
    call :log "GitHub CLI: automatic install failed"
    goto :pause_menu
)
echo.
echo Installed successfully. Please close this tool and open it
echo again, then choose option 2.
call :log "GitHub CLI: installed automatically"
goto :pause_menu

rem ==================== SUBROUTINES ===========================
:pause_menu
echo.
pause
goto :menu

:log
>> "%LOGFILE%" echo [%date% %time%] "%~1"
goto :eof

:clean
rem %~1 = name of a variable. Removes double-quote characters from
rem its value - a quote typed by the user could otherwise break the
rem upload command. The value is moved through files, never through
rem the command line, so no other character can break anything.
if not defined %~1 goto :eof
set %~1 > "%TEMP%\wm_raw.txt"
powershell -NoProfile -Command "$line = Get-Content -Raw '%TEMP%\wm_raw.txt'; $v = $line -replace '^[^=]*=','' -replace [string][char]34,'' -replace '\s+$',''; [Console]::Write($v)" > "%TEMP%\wm_clean.txt"
set "%~1="
set /p %~1=<"%TEMP%\wm_clean.txt"
goto :eof

:end
call :log "Tool closed"
endlocal
exit /b 0
