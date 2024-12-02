module.exports = function(pool) {
    return function(req, res) {
        console.log('subject-list 호출됨')

        console.log('req.user 객체의 값')
        console.dir(req.user);

        if (!req.user) {
            console.log('사용자 인증이 안된 상태임')
            res.sendStatus(403)
            return
        }

        console.log('사용자 인증된 상태임.');

        var subjectCodes = req.body.subjectCodes;

        if (pool) {
            pool.getConnection(function (err, conn) {
                if (err) {
                    if (conn) {
                        conn.release()
                    }
        
                    console.error(err)
                    res.sendStatus(500)
                    return
                }
                console.log('데이터베이스 연결 스레드 아이디: ' + conn.threadId)

                console.log(subjectCodes)
        
                var exec = conn.query(`select * from subjects where subject_code IN (${subjectCodes.map((code) => `\'${code}\'`).join(',')})`, function (err, result) {
                    conn.release()
        
                    console.log('실행 대상 SQL:' + exec.sql)
        
                    if(err) {
                        console.log('SQL 실행시 오류 발생함')
                        console.dir(err)
        
                        res.sendStatus(500)
        
                        return
                    }
                    
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(result))
                })
            })
        }
    }
}