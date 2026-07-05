# ITQ 엑셀 함수 75제 온라인 숙제장

학생이 이름과 함수를 선택하고, 문제 파일을 다운로드해 학습한 뒤 완성한 엑셀 파일을 제출할 수 있도록 준비한 GitHub Pages용 정적 웹페이지입니다.

제출 화면은 Apps Script Web App API에 JSON을 전송하도록 준비되어 있습니다. 실제 제출 전 Web App URL을 설정해야 합니다.

## 문제 파일 학습 방법

- 문제 파일은 원본 보호를 위해 Google Drive에서 바로 수정하지 않습니다.
- 학생은 카드의 **문제 파일 다운로드** 버튼으로 파일을 내려받은 뒤, 내 컴퓨터의 Excel에서 풀이합니다.
- 풀이가 끝난 파일은 학생용 페이지의 **이 함수 제출하기**에서 제출합니다.
- 브라우저 또는 Google Drive 정책에 따라 다운로드 대신 미리보기 화면이 먼저 열릴 수 있습니다.
- 이 경우 Drive 화면의 다운로드 버튼을 눌러 파일을 저장합니다.

## 폴더 구조

```text
/
├─ index.html
├─ README.md
├─ assets/
│  ├─ style.css
│  └─ app.js
└─ data/
   ├─ functions.json
   └─ students.json
```

## functions.json 수정

Google Sheets의 `functions_json_복사용` 시트 A3에 있는 JSON 전체를 복사해 `data/functions.json`의 내용으로 사용합니다.

```json
[
  {
    "id": "001",
    "name": "ABS",
    "displayName": "001_ABS",
    "level": "미분류",
    "description": "절댓값 계산하기",
    "page": 36,
    "problemUrl": "https://drive.google.com/file/d/FILE_ID/view"
  }
]
```

정답 파일명이나 정답 파일 링크는 추가하지 않습니다.

## students.json 수정

학생마다 중복되지 않는 `id`와 화면에 표시할 `name`을 입력합니다.

```json
[
  {
    "id": "S001",
    "name": "홍길동"
  }
]
```

JSON의 마지막 항목 뒤에는 쉼표를 넣지 않습니다.

## GitHub Pages 배포

1. `index.html`, `README.md`, `assets/`, `data/`만 GitHub 저장소에 올립니다.
   `apps-script/`는 실제 스프레드시트 ID와 제출 폴더 ID가 포함될 수 있으므로 공개 저장소에 올리지 않습니다.
2. 저장소의 **Settings → Pages**를 엽니다.
3. **Deploy from a branch**를 선택합니다.
4. 배포할 브랜치와 `/ (root)` 폴더를 선택하고 저장합니다.
5. 배포가 끝나면 표시되는 GitHub Pages 주소에서 페이지를 확인합니다.

## submitApiUrl 설정

`assets/app.js` 맨 위의 `CONFIG.submitApiUrl`에서 `APPS_SCRIPT_WEB_APP_URL_HERE`를 배포된 Apps Script Web App의 `/exec` URL로 교체합니다.

```javascript
const CONFIG = {
  submitApiUrl: "APPS_SCRIPT_WEB_APP_URL_HERE",
  pageTitle: "ITQ 엑셀 함수 75제 온라인 숙제장"
};
```

설정 예시:

```javascript
submitApiUrl: "https://script.google.com/macros/s/WEB_APP_ID/exec"
```

전송 시 파일을 base64로 변환하고 다음 값을 JSON으로 보냅니다.

- `studentId`
- `studentName`
- `functionId`
- `functionName`
- `displayName`
- `originalFileName`
- `mimeType`
- `fileBase64`

URL이 비어 있거나 `APPS_SCRIPT_WEB_APP_URL_HERE` 상태이면 실제 제출하지 않고 연결되지 않았다는 안내를 표시합니다.

## 제출 테스트

다음 순서로 확인합니다.

1. GitHub Pages에서 학생 이름을 선택합니다.
2. 함수 카드의 **이 함수 제출하기**를 누릅니다.
3. `.xlsx` 파일을 하나 첨부합니다.
4. **제출하기**를 누릅니다.
5. 화면에서 제출 완료 메시지, 저장파일명, 제출횟수를 확인합니다.
6. Google Drive의 학생 제출 폴더에서 저장 파일을 확인합니다.
7. Google Sheets의 `제출기록` 시트에서 제출 내용을 확인합니다.

`.xlsx`, `.xls`, `.xlsm` 파일만 제출할 수 있습니다. 제출 중에는 중복 요청 방지를 위해 제출 버튼이 비활성화됩니다.

## CORS 또는 제출 실패 확인

제출이 실패하면 다음 항목을 확인합니다.

- `CONFIG.submitApiUrl`이 정확한 Apps Script Web App `/exec` URL인지
- Web App이 최신 코드로 다시 배포되었는지
- Web App의 실행 사용자가 **나**인지
- 액세스 권한이 **링크가 있는 사용자** 또는 **모든 사용자**인지
- Apps Script의 `SUBMISSION_FOLDER_ID`가 실제 제출 폴더 ID인지
