module.exports = function(pool) {
    return function(req, res) {
        console.log('/login 호출됨')

        var paramId = req.body.id || req.query.id;
        var paramPassword = req.body.password || req.query.password;

        console.log("요청파라미터 : " + paramId + ', ' + paramPassword)

        if (pool) {
            authUser(pool, paramId, paramPassword, function(err, rows) {
                if (err) {
                    console.error('사용자 로그인 중 오류 발생 : ' + err.stack)

                    res.sendStatus(500)
                    return
                }

                if (rows) {
                    console.log(rows)

                    var username = rows[0].name;

                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({id: paramId, username: username}))
                } else {
                    res.sendStatus(404)
                }
            })
        }
    }
}

function authUser(pool, id, password, callback) {
    console.log('auth 호출됨.')

    pool.getConnection(function(err, conn) {
        if(err) {
            if(conn) {
                conn.release();
            }

            callback(err, null)
            return
        }
        console.log('데이터베이스 연결 스레드 아이디: ' + conn.threadId);

        var column = ['id', 'username']
        var tablename = 'users'

        var exec = conn.query('select ?? from ?? where id = ? and password = ?', [column, tablename, id, password], function(err, rows) {
            conn.release()
            console.log('실행 대상 SQL: ' + exec.sql)
            console.log(rows)

            if(rows?.length > 0) {
                console.log('아이디 [%s], 패스워드 [%s] 가 일치하는 사용자 찾음.', id, password)
                callback(null, rows)
            } else {
                console.log('일치하는 사용자를 찾지 못함')
                callback(null, null)
            }
        })
    })
}