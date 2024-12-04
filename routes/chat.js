const { getRandomString } = require('../util/util')
const { format } = require('date-fns')

module.exports = {
    getChatDateList,
    createChatRoom,
    getChatMessageList,
    closeChatRoom
}

function getChatDateList(pool) {
    return function(req, res) {
        console.log('/chat-date-list 호출됨')

        console.log('req.user 객체의 값')
        console.dir(req.user);

        if (!req.user) {
            console.log('사용자 인증이 안된 상태임')
            res.sendStatus(403)
            return
        }

        console.log('사용자 인증된 상태임.');

        var startDate = new Date(req.body.startDate);
        var endDate = new Date(req.body.endDate);
        var subjectCode = req.body.subjectCode;

        const startDateString = format(startDate, 'yyyy-MM-dd')
        const endDateString = format(endDate, 'yyyy-MM-dd')

        if (pool) {
            pool.getConnection(function(err, conn) {
                if (err) {
                    if (conn) {
                        conn.release()
                    }
        
                    res.sendStatus(500)
                    return
                }

                console.log('데이터베이스 연결 스레드 아이디: ' + conn.threadId)

                var exec = conn.query('select date, close FROM chat_rooms where date between ? and ? and subject_code = ? order by date;', [startDateString, endDateString, subjectCode], function(err, result) {
                    conn.release()

                    console.log('실행 대상 SQL:' + exec.sql)

                    if(err) {
                        console.log('SQL 실행시 오류 발생함')
                        console.dir(err)
        
                        res.sendStatus(500)
                        
                        return
                    }

                    res.setHeader('Content-Type', 'application/json');
                    if (result?.length > 0) {
                        res.end(JSON.stringify(result))
                    } else {
                        res.end(JSON.stringify([]))
                    }
                })
            })
        }
    }
}

function createChatRoom(pool) {
    return function(req, res) {
        console.log('/create-chat 호출됨')

        console.log('req.user 객체의 값')
        console.dir(req.user);

        if (!req.user) {
            console.log('사용자 인증이 안된 상태임')
            res.sendStatus(403)
            return
        }

        console.log('사용자 인증된 상태임.');

        var subjectCode = req.body.subjectCode;
        var date = new Date(req.body.date);

        if (pool) {
            pool.getConnection(function(err, conn) {
                if (err) { 
                    if (conn) {
                        conn.release()
                    }
                
                    res.sendStatus(500)
                    return
                }
                console.log('데이터베이스 연결 스레드 아이디: ' + conn.threadId)

                const data = {
                    id: getRandomString(8),
                    subject_code: subjectCode,
                    date: format(date, 'yyyy-MM-dd'),
                    close: false,
                }

                var exec = conn.query('insert into chat_rooms set ?', data, function(err, result) {
                    conn.release();

                    console.log('실행 대상 SQL:' + exec.sql)

                    if(err) {
                        console.log('SQL 실행시 오류 발생함')
                        console.dir(err)
        
                        res.sendStatus(500)
                        
                        return
                    }

                    res.sendStatus(200)
                    return
                })
            })
        }
    }
}

function closeChatRoom(pool) {
    return function(req, res) {
        console.log('/close-chat 호출됨')

        console.log('req.user 객체의 값')
        console.dir(req.user);

        if (!req.user) {
            console.log('사용자 인증이 안된 상태임')
            res.sendStatus(403)
            return
        }

        console.log('사용자 인증된 상태임.');

        var subjectCode = req.body.subjectCode;
        var date = format(new Date(req.body.date), 'yyyy-MM-dd');

        if (pool) {
            pool.getConnection(function (err, conn) {
                if (err) { 
                    if (conn) {
                        conn.release()
                    }
                
                    res.sendStatus(500)
                    return
                }
                console.log('데이터베이스 연결 스레드 아이디: ' + conn.threadId)

                var exec = conn.query('update chat_rooms set close = 1 where subject_code = ? and date = ?', [subjectCode, date], function(err, result) {
                    conn.release();

                    console.log('실행 대상 SQL:' + exec.sql)

                    if(err) {
                        console.log('SQL 실행시 오류 발생함')
                        console.dir(err)
        
                        res.sendStatus(500)
                        
                        return
                    }

                    res.sendStatus(200)
                })
            })
        }
    }
}

function getChatMessageList(pool) {
    return function(req, res) {
        console.log('/chat-message-list 호출됨.')

        console.log('req.user 객체의 값')
        console.dir(req.user);

        if (!req.user) {
            console.log('사용자 인증이 안된 상태임')
            res.sendStatus(403)
            return
        }

        console.log('사용자 인증된 상태임.');

        var date = format(new Date(req.body.date), 'yyyy-MM-dd');
        var subjectCode= req.body.subjectCode;

        if (pool) {
            pool.getConnection(function(err, conn) {
                if (err) { 
                    if (conn) {
                        conn.release()
                    }
                
                    res.sendStatus(500)
                    return
                }
                console.log('데이터베이스 연결 스레드 아이디: ' + conn.threadId)

                const isStudent = req.user.id?.length > 6

                var exec = conn.query(`select date, id, message, ${!isStudent ?'sender, ' : ''} empathy from chat_datas where subject_code = ? and chat_room = ?`, [subjectCode, date], function(err, result) {
                    conn.release();

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