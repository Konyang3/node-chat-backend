var express = require('express');
var http = require('http');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');

var mysql = require('mysql2')

var passport = require('passport');
var flash = require('connect-flash');

// Socket.IO 사용
var socketio = require('socket.io');

// cors 사용 - 클라이언트에서 ajax로 요청 시 CORS(다중 서버 접속) 지원
var cors = require('cors');

require('dotenv').config();

var subjectListRouter = require('./routes/subject-list')
var createSubjectRouter = require('./routes/create-subject')
var joinSubjectRouter = require('./routes/join-subject')
var chatRouters = require('./routes/chat')
var logout = require('./routes/logout')
var userRouter = require('./routes/user')

var {getRandomString} = require('./util/util')
var {insertChat, updateEmpathy, getEmpathy} = require('./database/chat')

//===== MySQL 데이터베이스 연결 설정 =====//
var pool      =    mysql.createPool({
    connectionLimit : 10, 
    host     : 'localhost',
    user     : 'root',
    password : 'JuHmrrFVnRE3h9i',
    database : 'chat_db',
    debug    :  false
});


var app = express();

app.set('port', process.env.PORT || 8080);
app.set('database', pool)

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressSession({secret: "my key", resave: true, saveUninitialized: true}))

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(cors({origin: 'http://localhost:3000', credentials: true, allowedHeaders: ['Content-Type'] }));

var router = express.Router();

var configPassport = require('./config/passport');
configPassport(passport);

router.route('/register').post(function (req, res, next) {
    passport.authenticate('local-signup', function(err, user, info) {
        console.log(err, user, info)
        if (err) return res.status(500).send();
        if (!user) return res.status(400).json({error:info?.message});

        return res.status(200).json(info?.message).send();
    })(req, res, next)
});

router.route('/login').post(function(req, res, next) { 
    passport.authenticate('local-login', {failureFlash: true}, function(err, user, info) {
        console.log(err, user, info)
        if (err) return res.status(500).send();
        if (!user) return res.status(400).json({error:info?.message});

        req.logIn(user, function(err) {
            if (err) return next(err);
            console.log('test')
            console.dir(user)

            return res.status(200).json({id: user.id, subject_codes: user.subject_codes?.split(',')}).send();
        });
    })(req, res, next)
});
router.route('/subject-list').post(subjectListRouter(pool))
router.route('/create-subject').post(createSubjectRouter(pool))
router.route('/join-subject').post(joinSubjectRouter(pool))
router.route('/chat-date-list').post(chatRouters.getChatDateList(pool))
router.route('/create-chat').post(chatRouters.createChatRoom(pool))
router.route('/chat-message-list').post(chatRouters.getChatMessageList(pool))
router.route('/close-chat').post(chatRouters.closeChatRoom(pool))
router.route('/logout').get(logout)
router.route('/user').get(userRouter)

app.use('/', router);

app.all('*', function (req, res) {
    console.log('not found')
    res.sendStatus(404)
})

var server = http.createServer(app).listen(app.get('port'), function() {
    console.log('익스프레스 서버를 시작했습니다 : ' + app.get('port'));
})

var login_ids = {};

//socket.io 서버를 시작합니다.
var io = socketio(server, {cors: {origin: '*'}});
console.log('socket.io 요청을 받아들일 준비가 되었습니다.');

//클라이언트가 연결했을 때의 이벤트 처리
io.sockets.on('connection', function(socket) {
	console.log('connection info :', socket.request.connection._peername);

	// 소켓 객체에 클라이언트 Host, Port 정보 속성으로 추가
	socket.remoteAddress = socket.request.connection._peername.address;
	socket.remotePort = socket.request.connection._peername.port;

    // 'login' 이벤트를 받았을 때의 처리
    socket.on('login', function(login) {
        console.log('login 이벤트를 받았습니다.');
        console.dir(login);

        // 기존 클라이언트 ID가 없으면 클라이언트 ID를 맵에 추가
        console.log('접속한 소켓의 ID : ' + socket.id);
        login_ids[login.id] = socket.id;
        socket.login_id = login.id;

        console.log('접속한 클라이언트 ID 갯수 : %d', Object.keys(login_ids).length);

        // 응답 메시지 전송
        sendResponse(socket, 'login', '200', '로그인되었습니다.');
    });

    // 'message' 이벤트를 받았을 때의 처리
    socket.on('message', function(message) {
    	console.log('message 이벤트를 받았습니다.');
    	console.dir(message);

        message.id = getRandomString(16)
        
        // 방에 들어있는 모든 사용자에게 메시지 전달
        io.sockets.in(message.recepient).emit('message', message);
        insertChat(pool, message.subjectCode, message.sender, message.data, message.date, message.id, message.chatRoomDate)
        // 응답 메시지 전송
        sendResponse(socket, 'message', '200', '방 [' + message.recepient + ']의 모든 사용자들에게 메시지를 전송했습니다.');
    });

    // 'room' 이벤트를 받았을 때의 처리
    socket.on('room', function(room) {
    	console.log('room 이벤트를 받았습니다.');
    	console.dir(room);
    	
        if (room.command === 'create') {

        	if (io.sockets.adapter.rooms[room.roomId]) { // 방이 이미 만들어져 있는 경우
        		console.log('방이 이미 만들어져 있습니다.');
        		
        	} else {
        		console.log('방을 새로 만듭니다.');
        		
        		socket.join(room.roomId);
        		
	            // var curRoom = io.sockets.adapter.rooms[room.roomId];
	            // curRoom.id = room.roomId;
	            // curRoom.name = room.roomName;
	            // curRoom.owner = room.roomOwner;
        	}

        } else if (room.command === 'delete') {

            socket.leave(room.roomId);
 
            if (io.sockets.adapter.rooms[room.roomId]) { // 방이  만들어져 있는 경우
            	delete io.sockets.adapter.rooms[room.roomId];
            } else {  // 방이  만들어져 있지 않은 경우
            	console.log('방이 만들어져 있지 않습니다.');
            	
            }
        } else if (room.command === 'join') {  // 방에 입장하기 요청

            socket.join(room.roomId);
         
            // 응답 메시지 전송
            sendResponse(socket, 'room', '200', '방에 입장했습니다.');
        } else if (room.command === 'leave') {  // 방 나가기 요청

            socket.leave(room.roomId);
         
            // 응답 메시지 전송
            sendResponse(socket, 'room', '200', '방에서 나갔습니다.');
        }

        var roomList = getRoomList();
        
        var output = {command:'list', rooms:roomList};
        console.log('클라이언트로 보낼 데이터 : ' + JSON.stringify(output));
        
        io.sockets.emit('room', output);
    });

    socket.on('empathy', function(message) {
        console.log('empathy 이벤트를 받았습니다.')

        getEmpathy(pool, message.messageId, function (empathyUserList) {
            if (typeof empathyUserList === 'boolean') return
    
            updateEmpathy(pool, message.messageId, message.sender, empathyUserList, function() {
                getEmpathy(pool, message.messageId, function(newEmpathyUserList) {
                    const empathy = newEmpathyUserList.split(',').filter((value) => value.length !== 0)
                    message.empathy = empathy
                    
                    io.sockets.in(message.recepient).emit('empathy', message);
                })
            })
        })
    })
});

function getRoomList() {
	console.dir(io.sockets.adapter.rooms);
	
    var roomList = [];
    
    Object.keys(io.sockets.adapter.rooms).forEach(function(roomId) { // for each room
    	console.log('current room id : ' + roomId);
    	var outRoom = io.sockets.adapter.rooms[roomId];
    	
    	// find default room using all attributes
    	var foundDefault = false;
    	var index = 0;
        Object.keys(outRoom.sockets).forEach(function(key) {
        	console.log('#' + index + ' : ' + key + ', ' + outRoom.sockets[key]);
        	
        	if (roomId == key) {  // default room
        		foundDefault = true;
        		console.log('this is default room.');
        	}
        	index++;
        });
        
        if (!foundDefault) {
        	roomList.push(outRoom);
        }
    });
    
    console.log('[ROOM LIST]');
    console.dir(roomList);
    
    return roomList;
}

// 응답 메시지 전송 메소드
function sendResponse(socket, command, code, message) {
	var statusObj = {command: command, code: code, message: message};
	socket.emit('response', statusObj);
}
