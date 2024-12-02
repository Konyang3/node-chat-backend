var LocalStrategy = require('passport-local').Strategy;

module.exports = new LocalStrategy({
		usernameField : 'id',
		passwordField : 'password',
		passReqToCallback : true    // 이 옵션을 설정하면 아래 콜백 함수의 첫번째 파라미터로 req 객체 전달됨
	}, function(req, id, password, done) {
        // 요청 파라미터 중 name 파라미터 확인
        var paramName = req.body.name || req.query.name;
	 
		console.log('passport의 local-signup 호출됨 : ' + id + ', ' + password + ', ' + paramName);
		
	    // findOne 메소드가 blocking되지 않도록 하고 싶은 경우, async 방식으로 변경
	    process.nextTick(function() {
	    	var database = req.app.get('database');

            database.getConnection(function(err, conn) {
                if(err) {
                    if(conn) {
                        conn.release();
                    }
        
                    return done(err)
                }

                console.log('데이터베이스 연결 스레드 아이디: ' + conn.threadId);

                var column = ['id']
                var tablename = 'users'
        
                var exec = conn.query('select ?? from ?? where id = ?', [column, tablename, id], function(err, rows) {
                    conn.release()
                    console.log('실행 대상 SQL: ' + exec.sql)
                    console.log(rows)

                    if (rows?.length > 0) {
                        console.log('기존에 계정이 있음')
                        return done(null, false, req.flash('signupMessage', '계정이 이미 있습니다.'))
                    } else {
                        var insert = conn.query('INSERT INTO users (id, username, password) VALUES(?,?,?);', [id, paramName, password], function(err, rows) {
                            console.log('실행 대상 SQL: ' + insert.sql)
                            conn.release()
                            if (err) throw err;
                            console.log('사용자 데이터 추가함', rows)
                            return done(null, {id: id, username: paramName, password: password})
                        })
                    }
                }) 
            })
	    });

	});
