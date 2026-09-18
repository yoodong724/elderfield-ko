# Welcome to Elderfield 한국어 패치

Steam Windows판용 비공식 한국어 패치입니다.

> 현재 시험 배포 단계이며, 게임 전체의 정상 동작은 아직 확인되지 않았습니다.

## 지원 버전

- Steam App ID: `3195440`
- 지원 Steam Build ID: **`25397593`**
- 현재 패치: **`v25397593-rc1`**

설치기는 원본 파일 해시를 확인하며, 다른 Steam 빌드에는 패치를 적용하지 않습니다.

## 설치

1. [Releases](https://github.com/yoodong724/elderfield-ko/releases)에서 최신 ZIP을 받습니다.
2. ZIP을 `Game.exe`가 있는 게임 폴더에 풉니다.
3. `elderfield-ko/install.cmd`를 실행합니다.

원래 상태로 되돌리려면 `elderfield-ko/restore.cmd`를 실행합니다.

압축 전 패치 파일은 `source/elderfield-ko`에 있습니다.

## 패치 이름 규칙

- 태그와 ZIP 이름에는 지원 Steam Build ID를 사용합니다: `v{Steam Build ID}-rc{패치 수정 번호}`
- 같은 Steam 빌드에서 패치를 수정하면 `rc2`, `rc3`처럼 RC 번호만 올립니다.
- Steam 빌드가 바뀌면 새 Build ID의 `rc1`부터 다시 시작합니다.
