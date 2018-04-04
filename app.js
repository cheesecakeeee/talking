var express = require("express");
var app = express();
var router = require("./controller/router.js");
// session中间件要写入主文件内，因为router里没有变量作用域？？？？？？？？？简单就是app开头的写照app文件内
var session = require('express-session');

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}))

// 模板引擎
app.set("view engine","ejs");
// 静态页面
app.use(express.static("./public"));
app.use("/avatar",express.static("./avatar"));


// 路由表
app.get("/",router.showIndex);
app.get("/regist",router.showRegist);
app.post("/doregist",router.doRegist);
app.get("/login",router.showLogin);
app.post("/dologin",router.doLogin);
app.get("/setavatar",router.showSetavatar);
app.post("/dosetavatar",router.doSetavatar);



app.listen(8888,()=>{console.log("server running at http://127.0.0.1:8888")});