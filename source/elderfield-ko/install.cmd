@echo off
chcp 65001 >nul
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
set "GAME_DIR=%~dp0.."
set "PATCH_DIR=%~dp0patch_files"
set "BACKUP_DIR=%~dp0backup-build-25483278"

if not exist "%GAME_DIR%\Game.exe" goto wrong_folder
if not exist "%GAME_DIR%\game_messages.csv" goto wrong_folder
if not exist "%GAME_DIR%\data\System.json" goto wrong_folder
if not exist "%GAME_DIR%\js\plugins.js" goto wrong_folder

if exist "%BACKUP_DIR%" if not exist "%BACKUP_DIR%\.ready" (
  echo [오류] 불완전한 Build 25483278 백업 폴더가 있습니다.
  echo elderfield-ko\backup-build-25483278 폴더를 확인해 주세요.
  pause
  exit /b 1
)

call :preflight
if errorlevel 1 goto unsupported_build

for %%F in (
  "game_messages.csv"
  "fonts\NotoSansCJKkr-Regular.otf"
  "js\plugins.js"
  "js\plugins\WTE_OverburdenedDiscardFix.js"
  "js\plugins\DM_InventorySearch.js"
  "js\plugins\WTE_KoreanSearchInput.js"
  "img\titles2\Command_0_ch.png_"
  "img\titles2\Command_1_ch.png_"
  "img\titles2\Command_2_ch.png_"
  "img\titles2\Command_3_ch.png_"
  "img\pictures\CustScene\who_ch.png_"
  "img\pictures\CustScene\are_ch.png_"
  "img\pictures\CustScene\you_ch.png_"
  "img\pictures\Calendar\SeasonofDeath_ch.png_"
  "img\pictures\Calendar\SeasonofRebirth_ch.png_"
  "img\pictures\Calendar\SeasonoftheHarvest_ch.png_"
  "img\pictures\Calendar\SeasonoftheWitch_ch.png_"
  "img\pictures\ControlPrompts\ALLPAD\ExtraControls_ALLPAD_ch.png_"
  "img\pictures\ControlPrompts\ALLPAD\Move_ALLPAD_ch.png_"
  "img\pictures\ControlPrompts\ALLPAD\Turn in Place_ALLPAD_ch.png_"
  "img\pictures\ControlPrompts\PC\ExtraControls_PC_ch.png_"
  "img\pictures\ControlPrompts\PC\Interact_PC_ch.png_"
  "img\pictures\ControlPrompts\PC\Menu_PC_ch.png_"
  "img\pictures\ControlPrompts\PC\Move_PC_ch.png_"
  "img\pictures\ControlPrompts\PC\Sprint_PC_ch.png_"
  "img\pictures\ControlPrompts\PC\Turn in Place_PC_ch.png_"
  "img\pictures\ControlPrompts\PS\Interact_PS_ch.png_"
  "img\pictures\ControlPrompts\PS\Menu_PS_ch.png_"
  "img\pictures\ControlPrompts\PS\Sprint_PS_ch.png_"
  "img\pictures\ControlPrompts\SW\Interact_SW_ch.png_"
  "img\pictures\ControlPrompts\SW\Menu_SW_ch.png_"
  "img\pictures\ControlPrompts\SW\Sprint_SW_ch.png_"
  "img\pictures\ControlPrompts\XBOX\Interact_XBOX_ch.png_"
  "img\pictures\ControlPrompts\XBOX\Menu_XBOX_ch.png_"
  "img\pictures\ControlPrompts\XBOX\Sprint_XBOX_ch.png_"
  "img\pictures\LoadingFarm_ch.png_"
  "img\pictures\LoadingLarge_ch.png_"
  "img\pictures\Luck_Lucky_ch.png_"
  "img\pictures\Luck_Neutral_ch.png_"
  "img\pictures\Luck_Unlucky_ch.png_"
  "img\pictures\Radio\3_ch.png_"
  "img\pictures\Seasons\Banner0_ch.png_"
  "img\pictures\Seasons\Banner1_ch.png_"
  "img\pictures\Seasons\Banner2_ch.png_"
  "img\pictures\Seasons\Banner3_ch.png_"
  "img\pictures\Signs\watch1_ch.png_"
  "img\pictures\Signs\watch2_ch.png_"
  "img\pictures\Signs\watch3_ch.png_"
  "img\pictures\Signs\watch4_ch.png_"
  "img\pictures\Tutorial\combat1_ch.png_"
  "img\pictures\Tutorial\combat7_ch.png_"
  "img\pictures\Tutorial\combat8_ch.png_"
  "img\pictures\Tutorial Images\combat8_ch.png_"
  "img\pictures\UpdatingCrops_ch.png_"
  "img\pictures\hweenDice\TREAT_ch.png_"
  "img\pictures\hweenDice\TRICK_ch.png_"
  "img\pictures\map_ch.png_"
  "img\pictures\relationship bar\decrease_ch.png_"
  "img\pictures\relationship bar\increased_ch.png_"
  "img\system\GameOver_ch.png_"
  "img\titles2\Command_6_ch.png_"
) do if not exist "%PATCH_DIR%\%%~F" (
  echo [오류] 패치 파일이 없습니다: %%~F
  pause
  exit /b 1
)
if not exist "%BACKUP_DIR%\.ready" call :make_backup
if errorlevel 1 goto failed

call :copy_patch
if errorlevel 1 goto rollback

echo 한국어 패치 설치가 완료되었습니다.
pause
exit /b 0

:wrong_folder
echo [오류] elderfield-ko 폴더를 Game.exe가 있는 게임 폴더 안에 넣어 주세요.
pause
exit /b 1

:unsupported_build
echo [오류] 이 패치는 Steam Build 25483278 전용입니다.
echo Steam에서 게임 파일을 최신 상태로 복구한 뒤 다시 시도해 주세요.
pause
exit /b 1

:preflight
call :verify_hash "%GAME_DIR%\data\System.json" "45c371cbda68cf3a7aa1ca9500dc3d3d563c93108decdbc57f68117aa86819c3" || exit /b 1
if exist "%BACKUP_DIR%\.ready" (
  call :verify_hash "%BACKUP_DIR%\game_messages.csv" "3696079ab195fd94fe7e9ccabd8b3351d5c7cf19fe276629b4a4c1db7aabdfb4" || exit /b 1
  call :verify_hash "%BACKUP_DIR%\js\plugins.js" "7459ecdc432962ce3a7ff3977cf53c7d2529d80ec3c9bb1e60acea022a8dd281" || exit /b 1
  call :verify_hash "%BACKUP_DIR%\js\plugins\WTE_OverburdenedDiscardFix.js" "60d4861950a0a09122768ca5b7b5da5bed4e69f99ad5cda48680ba1fcbe36cae" || exit /b 1
  call :verify_hash "%BACKUP_DIR%\js\plugins\DM_InventorySearch.js" "4666e6855e86f2a632fed37b223b13eb694fbf97a8f3a106d1701661b37f3f6d" || exit /b 1
) else (
  call :verify_hash "%GAME_DIR%\game_messages.csv" "3696079ab195fd94fe7e9ccabd8b3351d5c7cf19fe276629b4a4c1db7aabdfb4" || exit /b 1
  call :verify_hash "%GAME_DIR%\js\plugins.js" "7459ecdc432962ce3a7ff3977cf53c7d2529d80ec3c9bb1e60acea022a8dd281" || exit /b 1
  call :verify_hash "%GAME_DIR%\js\plugins\WTE_OverburdenedDiscardFix.js" "60d4861950a0a09122768ca5b7b5da5bed4e69f99ad5cda48680ba1fcbe36cae" || exit /b 1
  call :verify_hash "%GAME_DIR%\js\plugins\DM_InventorySearch.js" "4666e6855e86f2a632fed37b223b13eb694fbf97a8f3a106d1701661b37f3f6d" || exit /b 1
)
exit /b 0

:verify_hash
setlocal EnableDelayedExpansion
set "ACTUAL_HASH="
for /f "skip=1 tokens=* delims=" %%H in ('certutil -hashfile "%~1" SHA256 2^>nul') do if not defined ACTUAL_HASH set "ACTUAL_HASH=%%H"
set "ACTUAL_HASH=!ACTUAL_HASH: =!"
if /i not "!ACTUAL_HASH!"=="%~2" (endlocal & exit /b 1)
endlocal & exit /b 0

:make_backup
mkdir "%BACKUP_DIR%" >nul 2>nul || exit /b 1
break >"%BACKUP_DIR%\absent.txt"
for %%F in (
  "game_messages.csv"
  "fonts\NotoSansCJKkr-Regular.otf"
  "js\plugins.js"
  "js\plugins\WTE_OverburdenedDiscardFix.js"
  "js\plugins\DM_InventorySearch.js"
  "js\plugins\WTE_KoreanSearchInput.js"
  "img\titles2\Command_0_ch.png_"
  "img\titles2\Command_1_ch.png_"
  "img\titles2\Command_2_ch.png_"
  "img\titles2\Command_3_ch.png_"
  "img\pictures\CustScene\who_ch.png_"
  "img\pictures\CustScene\are_ch.png_"
  "img\pictures\CustScene\you_ch.png_"
  "img\pictures\Calendar\SeasonofDeath_ch.png_"
  "img\pictures\Calendar\SeasonofRebirth_ch.png_"
  "img\pictures\Calendar\SeasonoftheHarvest_ch.png_"
  "img\pictures\Calendar\SeasonoftheWitch_ch.png_"
  "img\pictures\ControlPrompts\ALLPAD\ExtraControls_ALLPAD_ch.png_"
  "img\pictures\ControlPrompts\ALLPAD\Move_ALLPAD_ch.png_"
  "img\pictures\ControlPrompts\ALLPAD\Turn in Place_ALLPAD_ch.png_"
  "img\pictures\ControlPrompts\PC\ExtraControls_PC_ch.png_"
  "img\pictures\ControlPrompts\PC\Interact_PC_ch.png_"
  "img\pictures\ControlPrompts\PC\Menu_PC_ch.png_"
  "img\pictures\ControlPrompts\PC\Move_PC_ch.png_"
  "img\pictures\ControlPrompts\PC\Sprint_PC_ch.png_"
  "img\pictures\ControlPrompts\PC\Turn in Place_PC_ch.png_"
  "img\pictures\ControlPrompts\PS\Interact_PS_ch.png_"
  "img\pictures\ControlPrompts\PS\Menu_PS_ch.png_"
  "img\pictures\ControlPrompts\PS\Sprint_PS_ch.png_"
  "img\pictures\ControlPrompts\SW\Interact_SW_ch.png_"
  "img\pictures\ControlPrompts\SW\Menu_SW_ch.png_"
  "img\pictures\ControlPrompts\SW\Sprint_SW_ch.png_"
  "img\pictures\ControlPrompts\XBOX\Interact_XBOX_ch.png_"
  "img\pictures\ControlPrompts\XBOX\Menu_XBOX_ch.png_"
  "img\pictures\ControlPrompts\XBOX\Sprint_XBOX_ch.png_"
  "img\pictures\LoadingFarm_ch.png_"
  "img\pictures\LoadingLarge_ch.png_"
  "img\pictures\Luck_Lucky_ch.png_"
  "img\pictures\Luck_Neutral_ch.png_"
  "img\pictures\Luck_Unlucky_ch.png_"
  "img\pictures\Radio\3_ch.png_"
  "img\pictures\Seasons\Banner0_ch.png_"
  "img\pictures\Seasons\Banner1_ch.png_"
  "img\pictures\Seasons\Banner2_ch.png_"
  "img\pictures\Seasons\Banner3_ch.png_"
  "img\pictures\Signs\watch1_ch.png_"
  "img\pictures\Signs\watch2_ch.png_"
  "img\pictures\Signs\watch3_ch.png_"
  "img\pictures\Signs\watch4_ch.png_"
  "img\pictures\Tutorial\combat1_ch.png_"
  "img\pictures\Tutorial\combat7_ch.png_"
  "img\pictures\Tutorial\combat8_ch.png_"
  "img\pictures\Tutorial Images\combat8_ch.png_"
  "img\pictures\UpdatingCrops_ch.png_"
  "img\pictures\hweenDice\TREAT_ch.png_"
  "img\pictures\hweenDice\TRICK_ch.png_"
  "img\pictures\map_ch.png_"
  "img\pictures\relationship bar\decrease_ch.png_"
  "img\pictures\relationship bar\increased_ch.png_"
  "img\system\GameOver_ch.png_"
  "img\titles2\Command_6_ch.png_"
) do call :backup_one "%%~F" || exit /b 1
break >"%BACKUP_DIR%\.ready"
exit /b 0

:backup_one
for %%D in ("%BACKUP_DIR%\%~1") do if not exist "%%~dpD" mkdir "%%~dpD" >nul 2>nul
if exist "%GAME_DIR%\%~1" (
  copy /y "%GAME_DIR%\%~1" "%BACKUP_DIR%\%~1" >nul || exit /b 1
) else (
  echo %~1>>"%BACKUP_DIR%\absent.txt"
)
exit /b 0

:copy_patch
for %%F in (
  "game_messages.csv"
  "fonts\NotoSansCJKkr-Regular.otf"
  "js\plugins.js"
  "js\plugins\WTE_OverburdenedDiscardFix.js"
  "js\plugins\DM_InventorySearch.js"
  "js\plugins\WTE_KoreanSearchInput.js"
  "img\titles2\Command_0_ch.png_"
  "img\titles2\Command_1_ch.png_"
  "img\titles2\Command_2_ch.png_"
  "img\titles2\Command_3_ch.png_"
  "img\pictures\CustScene\who_ch.png_"
  "img\pictures\CustScene\are_ch.png_"
  "img\pictures\CustScene\you_ch.png_"
  "img\pictures\Calendar\SeasonofDeath_ch.png_"
  "img\pictures\Calendar\SeasonofRebirth_ch.png_"
  "img\pictures\Calendar\SeasonoftheHarvest_ch.png_"
  "img\pictures\Calendar\SeasonoftheWitch_ch.png_"
  "img\pictures\ControlPrompts\ALLPAD\ExtraControls_ALLPAD_ch.png_"
  "img\pictures\ControlPrompts\ALLPAD\Move_ALLPAD_ch.png_"
  "img\pictures\ControlPrompts\ALLPAD\Turn in Place_ALLPAD_ch.png_"
  "img\pictures\ControlPrompts\PC\ExtraControls_PC_ch.png_"
  "img\pictures\ControlPrompts\PC\Interact_PC_ch.png_"
  "img\pictures\ControlPrompts\PC\Menu_PC_ch.png_"
  "img\pictures\ControlPrompts\PC\Move_PC_ch.png_"
  "img\pictures\ControlPrompts\PC\Sprint_PC_ch.png_"
  "img\pictures\ControlPrompts\PC\Turn in Place_PC_ch.png_"
  "img\pictures\ControlPrompts\PS\Interact_PS_ch.png_"
  "img\pictures\ControlPrompts\PS\Menu_PS_ch.png_"
  "img\pictures\ControlPrompts\PS\Sprint_PS_ch.png_"
  "img\pictures\ControlPrompts\SW\Interact_SW_ch.png_"
  "img\pictures\ControlPrompts\SW\Menu_SW_ch.png_"
  "img\pictures\ControlPrompts\SW\Sprint_SW_ch.png_"
  "img\pictures\ControlPrompts\XBOX\Interact_XBOX_ch.png_"
  "img\pictures\ControlPrompts\XBOX\Menu_XBOX_ch.png_"
  "img\pictures\ControlPrompts\XBOX\Sprint_XBOX_ch.png_"
  "img\pictures\LoadingFarm_ch.png_"
  "img\pictures\LoadingLarge_ch.png_"
  "img\pictures\Luck_Lucky_ch.png_"
  "img\pictures\Luck_Neutral_ch.png_"
  "img\pictures\Luck_Unlucky_ch.png_"
  "img\pictures\Radio\3_ch.png_"
  "img\pictures\Seasons\Banner0_ch.png_"
  "img\pictures\Seasons\Banner1_ch.png_"
  "img\pictures\Seasons\Banner2_ch.png_"
  "img\pictures\Seasons\Banner3_ch.png_"
  "img\pictures\Signs\watch1_ch.png_"
  "img\pictures\Signs\watch2_ch.png_"
  "img\pictures\Signs\watch3_ch.png_"
  "img\pictures\Signs\watch4_ch.png_"
  "img\pictures\Tutorial\combat1_ch.png_"
  "img\pictures\Tutorial\combat7_ch.png_"
  "img\pictures\Tutorial\combat8_ch.png_"
  "img\pictures\Tutorial Images\combat8_ch.png_"
  "img\pictures\UpdatingCrops_ch.png_"
  "img\pictures\hweenDice\TREAT_ch.png_"
  "img\pictures\hweenDice\TRICK_ch.png_"
  "img\pictures\map_ch.png_"
  "img\pictures\relationship bar\decrease_ch.png_"
  "img\pictures\relationship bar\increased_ch.png_"
  "img\system\GameOver_ch.png_"
  "img\titles2\Command_6_ch.png_"
) do call :copy_one "%%~F" || exit /b 1
exit /b 0

:copy_one
for %%D in ("%GAME_DIR%\%~1") do if not exist "%%~dpD" mkdir "%%~dpD" >nul 2>nul
copy /y "%PATCH_DIR%\%~1" "%GAME_DIR%\%~1" >nul || exit /b 1
fc /b "%PATCH_DIR%\%~1" "%GAME_DIR%\%~1" >nul || exit /b 1
exit /b 0

:rollback
echo [오류] 설치에 실패하여 원본을 복원합니다.
call "%~dp0restore.cmd" /quiet
:failed
pause
exit /b 1
