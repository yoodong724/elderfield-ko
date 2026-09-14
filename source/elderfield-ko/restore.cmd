@echo off
chcp 65001 >nul
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
set "GAME_DIR=%~dp0.."
set "BACKUP_DIR=%~dp0backup"

if not exist "%GAME_DIR%\Game.exe" (
  echo [오류] elderfield-ko 폴더를 Game.exe가 있는 게임 폴더 안에 넣어 주세요.
  if /i not "%~1"=="/quiet" pause
  exit /b 1
)
if not exist "%BACKUP_DIR%\.ready" (
  echo [오류] 복원용 백업이 없습니다.
  if /i not "%~1"=="/quiet" pause
  exit /b 1
)

if /i not "%~1"=="/quiet" (
  choice /c YN /n /m "패치를 제거하고 원본으로 복원할까요? [Y/N] "
  if errorlevel 2 exit /b 0
)

for %%F in (
  "game_messages.csv"
  "fonts\NotoSansCJKkr-Regular.otf"
  "js\plugins.js"
  "js\plugins\Hendrix_Localization_Overrides_Module.js"
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
) do call :restore_one "%%~F" || goto failed

echo 원본 복원이 완료되었습니다.
if /i not "%~1"=="/quiet" pause
exit /b 0

:restore_one
findstr /x /l /c:"%~1" "%BACKUP_DIR%\absent.txt" >nul
if not errorlevel 1 (
  if exist "%GAME_DIR%\%~1" del /f /q "%GAME_DIR%\%~1" >nul || exit /b 1
) else (
  if not exist "%BACKUP_DIR%\%~1" exit /b 1
  for %%D in ("%GAME_DIR%\%~1") do if not exist "%%~dpD" mkdir "%%~dpD" >nul 2>nul
  copy /y "%BACKUP_DIR%\%~1" "%GAME_DIR%\%~1" >nul || exit /b 1
  fc /b "%BACKUP_DIR%\%~1" "%GAME_DIR%\%~1" >nul || exit /b 1
)
exit /b 0

:failed
echo [오류] 원본 복원에 실패했습니다.
if /i not "%~1"=="/quiet" pause
exit /b 1
