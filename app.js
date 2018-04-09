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
app.get("/",router.showIndex);          //显示首页
app.get("/regist",router.showRegist);   //显示注册页面
app.post("/doregist",router.doRegist);  //执行注册
app.get("/login",router.showLogin);     //显示登录页面
app.post("/dologin",router.doLogin);    //执行登录
app.get("/setavatar",router.showSetavatar);     //显示上传头像
app.post("/dosetavatar",router.doSetavatar);    //执行上传
app.get("/crop",router.showCrop);       //显示裁切页面
app.get("/docrop",router.doCrop);       //执行裁切
app.post("/post",router.doPost);       //发表说说
app.get("/getallshuoshuo",router.getAllShuoshuo);   //列出所有说说ajax服务
app.get("/getuserinfo",router.getUserInfo);     //获取某用户信息ajax服务
app.get("/getshuoshuoamount",router.getShuoshuoAmount); //获取说说数量ajax服务
app.get("/")

app.listen(8888,function(){console.log("server running at http://127.0.0.1:8888")});