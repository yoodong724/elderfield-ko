@echo off
chcp 65001 >nul
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
set "GAME_DIR=%~dp0.."
set "PATCH_DIR=%~dp0patch_files"
set "BACKUP_DIR=%~dp0backup-build-26243857"

if not exist "%GAME_DIR%\Game.exe" goto wrong_folder
if not exist "%GAME_DIR%\game_messages.csv" goto wrong_folder
if not exist "%GAME_DIR%\data\System.json" goto wrong_folder
if not exist "%GAME_DIR%\js\plugins.js" goto wrong_folder

if exist "%BACKUP_DIR%" if not exist "%BACKUP_DIR%\.ready" (
  echo [오류] 불완전한 Build 26243857 백업 폴더가 있습니다.
  echo elderfield-ko\backup-build-26243857 폴더를 확인해 주세요.
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
  "js\plugins\VirtualModLoader_UI.js"
) do if not exist "%PATCH_DIR%\%%~F" (
  echo [오류] 패치 파일이 없습니다: %%~F
  pause
  exit /b 1
)
call :verify_payload
if errorlevel 1 goto failed
if exist "%BACKUP_DIR%\.ready" call :verify_backup
if errorlevel 1 goto failed
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
echo [오류] 이 패치는 Steam Build 26243857 전용입니다.
echo Steam에서 게임 파일을 최신 상태로 복구한 뒤 다시 시도해 주세요.
pause
exit /b 1

:preflight
call :verify_hash "%GAME_DIR%\js\plugins\WTE_Professions.js" "9f7f782a220264acbffbfee4cdf074003803b1256e10fab78a10b51f61225828" || exit /b 1
if exist "%BACKUP_DIR%\.ready" (
  call :verify_hash "%BACKUP_DIR%\js\plugins\VirtualModLoader_UI.js" "71cacbb6d7aa810c64084a7f56e267cd36cc345815fece7bbe54a0f4d457befd" || exit /b 1
) else (
  call :verify_hash "%GAME_DIR%\js\plugins\VirtualModLoader_UI.js" "71cacbb6d7aa810c64084a7f56e267cd36cc345815fece7bbe54a0f4d457befd" || exit /b 1
)
call :verify_hash "%GAME_DIR%\data\System.json" "c3b3ae49f14ae4d38088cba50e2ac40d0d8179c49167df81d78f90fab4ccbabf" || exit /b 1
if exist "%BACKUP_DIR%\.ready" (
  call :verify_hash "%BACKUP_DIR%\game_messages.csv" "c4ebb2a1589c68acd20107e24daf07ca0c26a3a76bbe82876f4fe03664efdd3c" || exit /b 1
  call :verify_hash "%BACKUP_DIR%\js\plugins.js" "d222a7cde5abce2c762b2349a467b21faece069dc3f21680c6c4e47678653bb8" || exit /b 1
  call :verify_hash "%BACKUP_DIR%\js\plugins\WTE_OverburdenedDiscardFix.js" "60d4861950a0a09122768ca5b7b5da5bed4e69f99ad5cda48680ba1fcbe36cae" || exit /b 1
  call :verify_hash "%BACKUP_DIR%\js\plugins\DM_InventorySearch.js" "4666e6855e86f2a632fed37b223b13eb694fbf97a8f3a106d1701661b37f3f6d" || exit /b 1
) else (
  call :verify_hash "%GAME_DIR%\game_messages.csv" "c4ebb2a1589c68acd20107e24daf07ca0c26a3a76bbe82876f4fe03664efdd3c" || exit /b 1
  call :verify_hash "%GAME_DIR%\js\plugins.js" "d222a7cde5abce2c762b2349a467b21faece069dc3f21680c6c4e47678653bb8" || exit /b 1
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
type nul >"%BACKUP_DIR%\absent.txt"
if errorlevel 1 exit /b 1
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
  "js\plugins\VirtualModLoader_UI.js"
) do call :backup_one "%%~F" || exit /b 1
call :verify_backup
if errorlevel 1 exit /b 1
type nul >"%BACKUP_DIR%\.ready"
if errorlevel 1 exit /b 1
exit /b 0

:backup_one
for %%D in ("%BACKUP_DIR%\%~1") do if not exist "%%~dpD" mkdir "%%~dpD" >nul 2>nul
if exist "%GAME_DIR%\%~1" (
  copy /y "%GAME_DIR%\%~1" "%BACKUP_DIR%\%~1" >nul || exit /b 1
  fc /b "%GAME_DIR%\%~1" "%BACKUP_DIR%\%~1" >nul || exit /b 1
  call :record_hash "%BACKUP_DIR%\%~1" || exit /b 1
) else (
  >>"%BACKUP_DIR%\absent.txt" echo(%~1
  if errorlevel 1 exit /b 1
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
  "js\plugins\VirtualModLoader_UI.js"
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

:verify_payload
call :verify_hash "%PATCH_DIR%\fonts\NotoSansCJKkr-Regular.otf" "6bcb2a0703aa137e874fc2dffa85f6c21ba9a67fa329e81b8c801663af7e992a" || exit /b 1
call :verify_hash "%PATCH_DIR%\fonts\NotoSansCJKkr-Regular.otf.LICENSE.txt" "6a73f9541c2de74158c0e7cf6b0a58ef774f5a780bf191f2d7ec9cc53efe2bf2" || exit /b 1
call :verify_hash "%PATCH_DIR%\game_messages.csv" "08898c447f69136c7ffdfd1339322ab9d3355e09bae82b4ff73add4ca502e639" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Calendar\SeasonofDeath_ch.png_" "f96542778b264935d2d4d3b3ced6277b655f3a5522adb49dafb6c0d88167b9f0" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Calendar\SeasonofRebirth_ch.png_" "b4829a33949c8422385aec3df65c4bcde6aeb9cecf9554c341f1fe5ba83ec8db" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Calendar\SeasonoftheHarvest_ch.png_" "d12f6627f903ad415fffa2c604761cebac3f202e0ec6ee154dd90ff2250fcd7c" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Calendar\SeasonoftheWitch_ch.png_" "c66b91acba0fba27b2ba8866f11af748ffaad95ef867c2726ee7dba8b589dcf6" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\ControlPrompts\ALLPAD\ExtraControls_ALLPAD_ch.png_" "b04378ddbaa9a367bdb8b15727216c510eb7118b24a223f722d65d961f45b553" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\ControlPrompts\ALLPAD\Move_ALLPAD_ch.png_" "4efa00a3d418ee497a131e5ca61cef379376aa00eae4ebc353be4d5466492c13" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\ControlPrompts\ALLPAD\Turn in Place_ALLPAD_ch.png_" "0c3290cf2e7179a70f89e89e6747862ff016d0fe58299d28404fc9f999eadd28" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\ControlPrompts\PC\ExtraControls_PC_ch.png_" "d7988c2130599a0b75549f41ea224ebf75201adf358972b43c42b2ea481d748a" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\ControlPrompts\PC\Interact_PC_ch.png_" "29b629e27f8cbfe12d9006c80af1c54caa943d8ca2b986d759b13d10e21ffa46" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\ControlPrompts\PC\Menu_PC_ch.png_" "a625601d083aab3fba3bdce51b916639c0e1224d22702085d3a88b7adf6a7cd6" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\ControlPrompts\PC\Move_PC_ch.png_" "d09381d63a8021512cb434a411958feb4519678e6e0d9058f6495971cb420e3e" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\ControlPrompts\PC\Sprint_PC_ch.png_" "0002ecb96d420a6d01df434014d25ed721599eb9b9f76c66124e6f51a800048c" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\ControlPrompts\PC\Turn in Place_PC_ch.png_" "89a479c62ad3e4a3ee410f4f66969a92642374c4c52a8a99b1610a3527b70f49" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\ControlPrompts\PS\Interact_PS_ch.png_" "cbbc223fc28c273b600978e13fa717eca07ce0bcdaed3e5abf7a5e280945819c" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\ControlPrompts\PS\Menu_PS_ch.png_" "33b55c295be08dbc62b4ecb785204db51a0e791fb0fa1bb503d0f4c5687cc449" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\ControlPrompts\PS\Sprint_PS_ch.png_" "63018d3a80430cc145545a6961b71d499f8a5c9ddccd06b433b1cba8d9b1fd72" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\ControlPrompts\SW\Interact_SW_ch.png_" "af53162236d5df9ff5ad6836da80e82704ee2fd9ca917b4ad422352f029e639a" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\ControlPrompts\SW\Menu_SW_ch.png_" "447ee6a2362c6d6807261485225218abd31e4eebaef3da6455aae78540a82810" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\ControlPrompts\SW\Sprint_SW_ch.png_" "6290966348aa12345e9719022df3407c54e896ade810365ed6290251fb6e864f" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\ControlPrompts\XBOX\Interact_XBOX_ch.png_" "114ec00505a37757871cbcc18769119d1e8c24fc398c25635a79e47eb7ddf6d8" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\ControlPrompts\XBOX\Menu_XBOX_ch.png_" "254ef226a965164911f93cecf6833a4ff18d973abc11cda0acf6ef5ce59aae79" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\ControlPrompts\XBOX\Sprint_XBOX_ch.png_" "b275f33b93c712aeedbded1085959c8c057da9dae63632457a7d107339d1656a" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\CustScene\are_ch.png_" "5e6f420ce8594f18e09784ccf9f9cc91550b48d74f1b75057996b230a3a05d85" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\CustScene\who_ch.png_" "6c67eb8efdac783bda343d484aa9ebaac8f83a23f9adc457e401c7368f5d9506" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\CustScene\you_ch.png_" "7cf85c71b0c766e6673533be24072bb9463c94a9bb37e7f4a1f4328f12da0a38" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\LoadingFarm_ch.png_" "1c0bc9c8253e7100bbc5f9f9240d7e696c7ba6e98b26f83449724ff9fd52ea80" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\LoadingLarge_ch.png_" "dbd118a712fca9d7174867b2b607f40060c7c719d0c4d23f75f13fba0e72d8d1" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Luck_Lucky_ch.png_" "c15dc1852d039d3c081ccaa8aad7b2bfa99accf0773e5f91e8370a48904c7f67" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Luck_Neutral_ch.png_" "db8fa8492c62b7acde6f05de53241db422e900133ad9d28c9a7900274410fe09" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Luck_Unlucky_ch.png_" "ec266137e57f275b9509e6ff2a100a2e29eef0d70975ea0a0ce9d51ccd336fb2" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Radio\3_ch.png_" "1183fa7831c8da80d0010c040347e7ec11799954499530c34916a412b62ed76b" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Seasons\Banner0_ch.png_" "a4ac0501a45b2f7ded34fa6823e8233b6e36d919e124ebc60ee717e3fc12086d" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Seasons\Banner1_ch.png_" "82232413d251b2e5ef9b80a3e3fa6bd0e5aa1cfe154f1a14ca3fdc5e3ec7f8ca" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Seasons\Banner2_ch.png_" "2b040a834bda7d54a8cad11a1370ca831f1d7fe619104f4072dfc2408bcd8cc2" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Seasons\Banner3_ch.png_" "37b0809aae0eea9e12842d0935b2b0d52026fd0fee5b28cd603f5f467aa8e9dd" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Signs\watch1_ch.png_" "8c9e035e17a2fc94b293508a3c3d95d7202efbd8c50bb5e62ea925261c129b37" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Signs\watch2_ch.png_" "94fb1145eea04773d26fa99b4a7c289f780155e570668ad56c9e5c957f329d94" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Signs\watch3_ch.png_" "79d99fb138ab6a65fc5418ba5f9d16c56113f9d77b721cea28083d844eb4d890" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Signs\watch4_ch.png_" "cc382ed7179fcb3327f3f5d2fd429069d157b3a96c09593c2cabd271d9dbe77a" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Tutorial Images\combat8_ch.png_" "a7b86f36ed3f5fed4da45b158e8f9bf16c49057c48d8df53078cecb97e7e42b2" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Tutorial\combat1_ch.png_" "5f27437938addffed90ec9b2792b897b2d862d60067cffaba8a7ced0be41f304" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Tutorial\combat7_ch.png_" "202bb91ca9906dbd76577bb3bd03b382ec728bcccb7a30707675c115d6ac6948" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\Tutorial\combat8_ch.png_" "a7b86f36ed3f5fed4da45b158e8f9bf16c49057c48d8df53078cecb97e7e42b2" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\UpdatingCrops_ch.png_" "0d630d5a6783e72a4f8398461f98386f1d729cecdf0e07fb388f6ee638ce3016" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\hweenDice\TREAT_ch.png_" "2e95a8b411323465980392ac1dbb570e2d60416419b2dc235d905875d2eb92ff" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\hweenDice\TRICK_ch.png_" "8c4b46148bf88e8514bb873ba615109be10b3e425a8be6d985a101ee64908e19" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\map_ch.png_" "3d8fdb74237ce23a33ff19a15bbfec6a3e038b7ca874291e2047f409fc072c44" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\relationship bar\decrease_ch.png_" "204dbd76ff417b1d33b19cddc2fd13293a319a3e290a0c77dd2923fb113d21cf" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\pictures\relationship bar\increased_ch.png_" "7cbfb1a061d0c7706371cd12a96dcc082a7e27832c710fec178f1859bb115950" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\system\GameOver_ch.png_" "54e76accb348703d795aab7d9174dbe6cbb7cfc13337a809b3769ab49902052f" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\titles2\Command_0_ch.png_" "d60d4767f96d71ea5397707006c9f0de5eccbf1235fb3d6e1ac50ef1cc4f42d9" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\titles2\Command_1_ch.png_" "3ec7a93cbdfe4c699ba6a517aece6c62fb8ccb450c33fecf86f8931383d2fb77" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\titles2\Command_2_ch.png_" "db39adea456e7f59bb25a57856d025530acf10448721e076a125a3ca09919276" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\titles2\Command_3_ch.png_" "524e6f7d6947874e96bf84040c6bfa3935553126628b953ab60e6f6999c67e1d" || exit /b 1
call :verify_hash "%PATCH_DIR%\img\titles2\Command_6_ch.png_" "51c4160813989d17986bb02ad07a437edd9bdcf7021b08785516e4155590c0c8" || exit /b 1
call :verify_hash "%PATCH_DIR%\js\plugins.js" "ba48a1dd8c58c7c41673bfcd34114f137bfd8df4c2b965895bd6a92103eb3369" || exit /b 1
call :verify_hash "%PATCH_DIR%\js\plugins\DM_InventorySearch.js" "b6e0b41577f04dac72bd02648e89c969fce4bbb306120b7ca2e337970962753f" || exit /b 1
call :verify_hash "%PATCH_DIR%\js\plugins\VirtualModLoader_UI.js" "19c122ebeb342c89c5727172e7ba6a6ae6c3ed98640c94fecc4be955c00fbe23" || exit /b 1
call :verify_hash "%PATCH_DIR%\js\plugins\WTE_KoreanSearchInput.js" "61eec3e2c9878e8797245e795ce8e369326dbfc26190ba054df2f5259a218878" || exit /b 1
call :verify_hash "%PATCH_DIR%\js\plugins\WTE_OverburdenedDiscardFix.js" "e0916698bc4782fbe7d531a9daa9b3eca50c0109ad5bf1b7ebcfeb3cfd6661ba" || exit /b 1
call :verify_hash "%PATCH_DIR%\manifest.json" "5fd7b7e6bf141942022f7bae8eecae0dad704d5b0705c4d6d073782732104491" || exit /b 1
exit /b 0

:record_hash
setlocal EnableDelayedExpansion
set "ACTUAL_HASH="
for /f "skip=1 tokens=* delims=" %%H in ('certutil -hashfile "%~1" SHA256 2^>nul') do if not defined ACTUAL_HASH set "ACTUAL_HASH=%%H"
set "ACTUAL_HASH=!ACTUAL_HASH: =!"
if "!ACTUAL_HASH:~63,1!"=="" (endlocal & exit /b 1)
if not "!ACTUAL_HASH:~64,1!"=="" (endlocal & exit /b 1)
>"%~1.sha256" echo !ACTUAL_HASH!
if errorlevel 1 (endlocal & exit /b 1)
endlocal & exit /b 0

:verify_backup
if not exist "%BACKUP_DIR%\absent.txt" exit /b 1
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
  "js\plugins\VirtualModLoader_UI.js"
) do call :verify_backup_one "%%~F" || exit /b 1
exit /b 0

:verify_backup_one
findstr /x /l /c:"%~1" "%BACKUP_DIR%\absent.txt" >nul
if errorlevel 2 exit /b 1
if not errorlevel 1 (
  if exist "%BACKUP_DIR%\%~1" exit /b 1
  if exist "%BACKUP_DIR%\%~1.sha256" exit /b 1
  exit /b 0
)
if not exist "%BACKUP_DIR%\%~1.sha256" exit /b 1
set "EXPECTED_HASH="
set /p EXPECTED_HASH=<"%BACKUP_DIR%\%~1.sha256" || exit /b 1
call :verify_hash "%BACKUP_DIR%\%~1" "%EXPECTED_HASH%" || exit /b 1
exit /b 0
