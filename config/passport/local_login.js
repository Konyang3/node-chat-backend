var LocalStrategy = require('passport-local').Strategy;
const {aesDecrypt, sha256Encrypt} = require('../../util/crypto')

module.exports = new LocalStrategy({
		usernameField : 'id',
		passwordField : 'password',
		passReqToCallback : true   // 이 옵션을 설정하면 아래 콜백 함수의 첫번째 파라미터로 req 객체 전달됨
	}, function(req, id, password, done) { 
		console.log('passport의 local-login 호출됨 : ' + id + ', ' + password);
		
		var database = req.app.get('database');

        database.getConnection(function(err, conn) {
            if(err) {
                if(conn) {
                    conn.release();
                }
    
                return done(err)
            }
            console.log('데이터베이스 연결 스레드 아이디: ' + conn.threadId);
    
            var column = ['id', 'password', "subject_codes"]
            var tablename = 'users'

            const hashedPassword = sha256Encrypt(aesDecrypt(password, process.env.PASSWORD_SECRET))
    
            var exec = conn.query('select ?? from ?? where id = ? and password = ?', [column, tablename, id, hashedPassword], function(err, rows) {
                conn.release()
                console.log('실행 대상 SQL: ' + exec.sql)
                console.log(rows)

                if (rows === undefined || rows?.length <= 0)  {
                    console.log('일치하는 사용자를 찾지 못함')
                    return done(null, false, req.flash('loginMessage', '등록된 계정이 없습니다.'))
                }
    
                if(rows[0].password !== hashedPassword) {
                    console.log('비밀번호가 일치하지 않음')
                    return done(null, false, req.flash('loginMessage', '비밀번호가 일치하지 않습니다.'))
                }

                console.log('계정과 비밀번호가 일치함')
                return done(null, rows[0])
            })
        })

	});

