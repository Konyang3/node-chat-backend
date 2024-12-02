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

var subjectListRouter = require('./routes/subject-list')
var createSubjectRouter = require('./routes/create-subject')
var joinSubjectRouter = require('./routes/join-subject')
var chatRouters = require('./routes/chat')

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

            return res.status(200).json({...user, subject_codes: user.subject_codes?.split(',')}).send();
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

app.use('/', router);

app.all('*', function (req, res) {
    console.log('not found')
    res.sendStatus(404)
})

var server = http.createServer(app).listen(app.get('port'), function() {
    console.log('익스프레스 서버를 시작했습니다 : ' + app.get('port'));
})
//socket.io 서버를 시작합니다.
var io = socketio(server, {cors: {origin: '*'}});
console.log('socket.io 요청을 받아들일 준비가 되었습니다.');

//클라이언트가 연결했을 때의 이벤트 처리
io.sockets.on('connection', function(socket) {
	console.log('connection info :', socket.request.connection._peername);

	// 소켓 객체에 클라이언트 Host, Port 정보 속성으로 추가
	socket.remoteAddress = socket.request.connection._peername.address;
	socket.remotePort = socket.request.connection._peername.port;
});

