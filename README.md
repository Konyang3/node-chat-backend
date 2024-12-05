# node-chat-backend

# 실행방법

- 데이터베이스는 mysql이 설치되어있어야 하고 테이블이 이미 생성되어있어야 합니다.

1. node-chat-backend 폴더 안에 .env 파일을 만듭니다.
2. .env 파일에 다음과 같은 키를 넣습니다. (꺽쇠 안은 필요한 데이터로 치환합니다.)

```
PASSWORD_SECRET = <비밀번호 암호화 대칭 키>
DB_PASSWORD = <데이터 베이스 비밀번호>
```

3. node-chat-backend 폴더 안에서 yarn install을 실행합니다.
4. yarn start를 실행합니다.
