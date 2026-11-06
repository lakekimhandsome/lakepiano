# Lake Piano

브라우저에서 마우스와 키보드로 연주하는 피아노입니다.

사이트: https://piano.lakekim.com

## 폴더 구조

```text
index.html             웹 페이지
CNAME                  GitHub Pages 도메인
assets/
  css/style.css        스타일
  js/script.js         오디오 재생 및 키보드 매핑
  audio/
    mp3/               웹에서 재생하는 음원
    wav/               보관용 WAV 음원
tests/
  keyboard.test.cjs    키보드 매핑 및 음원 경로 테스트
```

## 실행 및 테스트

프로젝트 루트에서 `python3 -m http.server 8000`을 실행한 후
http://localhost:8000 에 접속합니다.

테스트: `node --test tests/keyboard.test.cjs`

## 배포

`main` 브랜치의 루트 폴더를 GitHub Pages로 자동 배포합니다.
별도 빌드나 의존성 설치는 필요하지 않습니다.
