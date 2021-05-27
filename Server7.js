var helmet = require('helmet');
const express = require('express');
let room = ['room1', 'room2', 'room3'];
let a = 0;
var socket = require('socket.io')
//var bodyParser = require('body-parser');
var app = express();
var mysql = require('mysql');
var router = require('./router/main')(app);
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var http = require('https');
const PUBLIC_PATH = `views`;
var bodyParser = require('body-parser');
const {log} = console;
const https = require('https');
const sslConfig = require('./ssl-config');

var nodeStatic = require('node-static');
var connection = mysql.createConnection({
    host: 'localhost',
    post: 3306,
    user: 'hyeonjun',
    password: 'Jun16417814#',
    database: 'test'
});

const options = {
    key: sslConfig.privateKey,
    cert: sslConfig.certificate,
    passphrase: 'jun16417814' // certificate을 생성하면서 입력하였던 passphrase 값
};
//app.use(helmet());
//app.use(helmet.noCache());
//app.use(helmet.hpkp());
app.set('views',__dirname + '/views');
app.set('view engine','ejs');
app.engine('html',require('ejs').renderFile);
//ejs를 실행해 준 뒤 views folder에서 html을 redering 해주는 부분입니다.

var fileServer = new(nodeStatic.Server)();

var server =http.createServer(options, app).listen(3333, () => {
    console.log('HTTPS Server Started');
});

app.get('/chat2', (req, res) => {
    res.sendFile(path.join(`${__dirname}/${PUBLIC_PATH}/chat2.html`));
})

app.get('/chat', (req, res) => {
    res.sendFile(path.join(`${__dirname}/${PUBLIC_PATH}/chat1.html`));
})



app.io = socket(server);

app.io.on("connection", socket => {
    log(`made socket connection : ${socket.id}`);
    socket.on('disconnect', function() {
        console.log('user가 나갔습니다')
        /* 나가는 사람을 제외한 나머지 유저에게 메시지 전송 */
        socket.broadcast.emit('chat-msg', 'Server','user가 채팅방을 나갔습니다.');
    })



    socket.on('joinRoom', (num, name) => {
        console.log('111111');
        console.log(name);
        app.io.to(room[num]).emit('joinRoom', num, name);
        socket.join(room[num], () => {
            console.log('222222')
            app.io.to(room[num]).emit('joinRoom', num, name);
        });
    });

    socket.on('leaveRoom', (num, name) => {
        console.log('3333');
        console.log(name);
        app.io.to(room[num]).emit('leaveRoom', num, name);
        socket.leave(room[num], () => {
            app.io.to(room[num]).emit('leaveRoom', num, name);
        });
    });
    socket.on('chat-msg', (num, name, msg) => {
        a = num;
       app.io.to(room[a]).emit('chat-msg', name, msg); // to(room[a])를 통해 그룹에게만 메세지를 날린다.
    });
});
//https를 통해서 서버를 시작하는부분입니다.
//app.use(helmet.nocache());
//app.use(helmet.csp());
/*
app.use(
    helmet({
        referrerPolicy: { policy: "no-referrer" },
    })
);
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'","https://localhost:3333"],
            scriptSrc: ["'self'", "https://localhost:3333"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    })
);\
*/

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
app.use(bodyParser.json())
app.use(express.static('public'));
connection.connect();




app.post('/Register',function(req,res){

    var id = req.body.id;
    var password = req.body.password;
    var passwordconfirm = req.body.passwordconfirm;
    var NickName = req.body.nickname;

    if(!id || !password || !NickName || !passwordconfirm) {
        // 하나라도 누락된 경우
        //res.send('입력 하지 못한 정보가 있습니다. 다시 입력해주세요.');
        res.write("<script language=\"javascript\">alert('There is information that has not been entered.')</script>");
        res.write("<script language=\"javascript\">window.location=\"biomedical_register.html\"</script>")
        return;
    }
    if(password != passwordconfirm){
        // res.send('비밀번호를 다시 입력해주세요 처리 ')
        res.write("<script language=\"javascript\">alert('there is not same the password and confrim password')</script>");
        res.write("<script language=\"javascript\">window.location=\"biomedical_register.html\"</script>")
        return;
    }
    else {
        console.log(req.body);
        //console.log(connection);
        var sql = 'INSERT INTO users (id, pw, displayName) values (?, ?, ?)';
        var params = [id, password, NickName];
        console.log(params);
        connection.query(sql, params, function(err, rows, fields) {
            if(err)
                console.log(err);
            else {
                console.log(rows);
                //  res.send('회원가입이 완료되었습니다.');
                res.write("<script language=\"javascript\">alert('Register is Success')</script>");
                res.write("<script language=\"javascript\">window.location=\"biomedical_Login.html\"</script>");
            }
        });
    }
})


app.post('/Login',function(req,res){
    var id = req.body.id; //parsing
    var password = req.body.password;
    var sql = 'SELECT * FROM users WHERE id=?'
    var params = [id];
    connection.query(sql,params,function(err,rows,fields){
        var user = rows[0];
        console.log(user);
        if(user === undefined){
            //res.send('nope');
            res.write("<script language=\"javascript\">alert('ID is wrong')</script>");
            res.write("<script language=\"javascript\">window.location=\"biomedical_Login.html\"</script>")
            return;
        }
        if(user.pw == password) {
            res.redirect('/');
            res.end();
        }
        else {
            res.write("<script language=\"javascript\">alert('Password is wrong')</script>");
            res.write("<script language=\"javascript\">window.location=\"biomedical_Login.html\"</script>")
            res.end();
            //res.send('<script type = "text/javascript">alert("다시한번 곰곰히 생각해보세요!.");</script>');
            //res.redirect('/biomedical_Login.html');
            //res.render('biomedical_Login.html',{title:'비밀번호 조회',pass : false});
            //res.json({success:false});
            //redirect 안되는 문제 발생
            //fs.readFile('./public/data/pw.json',function (err,data) {
            // var temp = '{"results": "false"}';
            // fs.writeFileSync('./public/data/pw.json',temp);
            //console.log('completed');
            //res.redirect('/biomedical_Login.html');
            //res.Write("<script language=\"javascript\">alert('테스트')</script>");
            //res.Write("<script language=\"javascript\">window.location=\"biomedical_Login.html\"</script>");
            //});
        }
    })
})

//express 모듈을 통해 public안에있는 웹서비스적인 자바스크립트 ,css 파일을 불러옵니다.