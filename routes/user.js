module.exports = function(pool) { 
    return function (req, res) {
        console.log('/user 호출됨')

        console.log('req.user 객체의 값')
        console.dir(req.user);

        if (!req.user) {
            console.log('사용자 인증이 안된 상태임')
            res.sendStatus(403)
            return
        }

        console.log('사용자 인증된 상태임.');

        if (pool) {
            pool.getConnection(function (err, conn) {
                if(err) {
                    if(conn) {
                        conn.release();
                    }
        
                    return done(err)
                }
                console.log('데이터베이스 연결 스레드 아이디: ' + conn.threadId);

                var exec = conn.query('select subject_codes from users where id = ?', req.user.id, function(err, rows) {
                    conn.release()
                    console.log('실행 대상 SQL: ' + exec.sql)
                    console.log(rows)
    
                    if (rows?.length > 0) {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({id: req.user.id, subjectCodes: rows[0].subject_codes?.split(',')}))
                    } else {
                        res.sendStatus(404)
                    }
                })
            })
        }
    }
}