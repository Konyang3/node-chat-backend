module.exports = function(pool) {
    return function(req, res) {
        console.log('create-subject 호출됨.')

        console.log('req.user 객체의 값')
        console.dir(req.user);

        if (!req.user) {
            console.log('사용자 인증이 안된 상태임')
            res.sendStatus(403)
            return
        }

        console.log('사용자 인증된 상태임.');

        var subjectName = req.body.subjectName;
        var professorName = req.body.professorName;
        var separatedClass = req.body.separatedClass;
        var subjectCode = req.body.subjectCode;

        if(pool) {
            pool.getConnection(function(err, conn) {
                if (err) {
                    if (conn) {
                        conn.release()
                    }
        
                    res.sendStatus(500)
                    return
                }

                console.log('데이터베이스 연결 스레드 아이디: ' + conn.threadId)

                var data = {
                    subject_name: subjectName, 
                    professor_name: professorName, 
                    separated_class: separatedClass,
                    subject_code: subjectCode
                }

                var exec = conn.query('insert into subjects set ?', data, function (err, result) {
                    conn.release()

                    console.log('실행 대상 SQL:' + exec.sql)

                    if(err) {
                        console.log('SQL 실행시 오류 발생함')
                        console.dir(err)
        
                        res.sendStatus(500)
                        
                        return
                    }

                    var insert = conn.query('update users set subject_codes = IF(LENGTH(subject_codes), CONCAT(subject_codes, \',\', ?), CONCAT(subject_codes, ?)) where id = ?', [data.subject_code, data.subject_code, req.user.id], function(err, result) {
                        conn.release()
                        console.log('실행 대상 SQL: ' + insert.sql)

                        if(err) {
                            console.log('SQL 실행시 오류 발생함')
                            console.dir(err)
            
                            res.sendStatus(500)
                            
                            return
                        }

                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(data))
                    })
                })
            })
        }
    }
}
