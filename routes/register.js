module.exports = function(pool) {
    return function (req, res) {
        console.log('/register 호출됨')

        var paramId = req.body.id || req.query.id
        var paramPassword = req.body.password || req.query.password
        var paramName = req.body.name || req.query.name

        console.log('요청 파라미터' + paramId + ', ' + paramPassword + ', ' + paramName)
        console.dir(req.body, req.query)

        if (pool) {
            addUser(pool, paramId, paramName, paramPassword, function (err, addedUser) {
                if (err) {
                    console.log('사용자 추가 중 오류 발생:' + err.stack);

                    res.sendStatus(409)
                    return
                }

                if (addedUser) {
                    console.dir(addedUser)

                    res.sendStatus(200)
                }
            })
        }
    }
} 

function addUser(pool, id, name, password, callback) {
    console.log('addUser 호출 됨')

    pool.getConnection(function (err, conn) {
        if (err) {
            if (conn) {
                conn.release()
            }

            callback(err, null)
            return
        }
        console.log('데이터베이스 연결 스레드 아이디: ' + conn.threadId)

        var data = {id: id, username: name, password: password}

        var exec = conn.query('insert into users set ?', data, function (err, result) {
            conn.release()

            console.log('실행 대상 SQL:' + exec.sql)

            if(err) {
                console.log('SQL 실행시 오류 발생함')
                console.dir(err)

                callback(err, null)

                return
            }

            callback(null, result)
        })
    })
}