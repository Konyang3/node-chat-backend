const { format } = require("date-fns")

module.exports = {
    insertChat,
    updateEmpathy,
    getEmpathy
}

function insertChat(pool, subjectCode, sender, message, date, id, chatRoomDate) {
    if (pool) {
        pool.getConnection(function(err, conn) {
            if (err) {
                if (conn) {
                    conn.release()
                }
                return
            }

            console.log('데이터베이스 연결 스레드 아이디: ' + conn.threadId)

            var data = {
                subject_code: subjectCode, 
                id, 
                message,
                sender,
                date: format(date, 'yyyy-MM-dd HH:mm'),
                empathy: "",
                chat_room: format(chatRoomDate, 'yyyy-MM-dd')
            }

            var exec = conn.query('insert into chat_datas set ?', data, function(err, result) {
                conn.release()

                console.log('실행 대상 SQL:' + exec.sql)

                if(err) {
                    console.log('SQL 실행시 오류 발생함')
                    console.dir(err)
                    
                    return
                }
            })
        })
    }
}

function updateEmpathy(pool, messageId, userId, empathyUserList, callback) {
    if (pool) {
        pool.getConnection(function(err, conn) {
            if (err) {
                if (conn) {
                    conn.release()
                }
                return
            }

            console.log('데이터베이스 연결 스레드 아이디: ' + conn.threadId)

            const toggle = empathyUserList.includes(userId)
            userId = userId + ","


            if (toggle) {
                var exec = conn.query('update chat_datas set empathy = REPLACE(empathy, ?, \'\') where id = ?', [userId, messageId], function(err, result) {
                    conn.release()

                    console.log('실행 대상 SQL:' + exec.sql)

                    if (err) {
                        console.log('SQL 실행시 오류 발생함')
                        console.dir(err)
                        
                        return
                    }

                    callback()
                })
            } else {
                var exec = conn.query('update chat_datas set empathy = CONCAT(empathy,?) where id = ?', [userId, messageId], function(err, result) {
                    conn.release()

                    console.log('실행 대상 SQL:' + exec.sql)

                    if (err) {
                        console.log('SQL 실행시 오류 발생함')
                        console.dir(err)
                        
                        return
                    }

                    callback()
                })
            }
        })
    }
}

function getEmpathy(pool, messageId, callback) {
    if (pool) {
        pool.getConnection(function(err, conn) {
            if (err) {
                if (conn) {
                    conn.release()
                }
                return false
            }

            console.log('데이터베이스 연결 스레드 아이디: ' + conn.threadId)

            var exec = conn.query('select empathy from chat_datas where id = ?', [messageId], function(err, result) {
                conn.release()

                console.log('실행 대상 SQL:' + exec.sql)

                if (err) {
                    console.log('SQL 실행시 오류 발생함')
                    console.dir(err)
                    
                    return false
                }
                callback(result?.length > 0 ? result[0].empathy : '')
                return result?.length > 0 ? result[0].empathy : ''
            })
        })
    }
}