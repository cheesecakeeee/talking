var formidable = require('formidable');
var db1 = require("../models/db1.js");
var md5 = require("../models/md5.js");
var path = require("path");


// 首页
exports.showIndex = function(req,res,next){
    // 如果已登录查找数据库是否有新头像
    if(req.session.login == "1"){
        db1.find("user",{username:req.session.username},function(err,result){
            var avatar = result[0].avatar || "ini.png";
            res.render("index",{
                "login": true,
                "username": req.session.username,
                "active":"首页",
                "avatar": avatar//登录成功后从数据库读头像地址，session标记是否登录
            });
        })
    }
    else{
        res.render("index",{
            // "login": req.session.login == "1" ? true : false,
            // "username": req.session.login == "1" ? req.session.username : "",
            "login":false,
            "username": "",
            "active":"首页",
            "avatar":"ini.png" 
        });
    }
    
}
// 注册页
exports.showRegist = function(req,res,next){
    res.render("regist",{
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : "",
        "active":"注册"
    });
}

// 注册业务
exports.doRegist = function(req,res,next){
    var form = new formidable.IncomingForm();
    // 得到用户提交表单
    form.parse(req, function(err, fields, files) {
        // 获取用户提交数据
        var username = fields.username;
        var password = fields.password;
        // 查询数据库是否存在
        db1.find("user",{"username":username},function(err,result){
            if(err){
                res.send("-3"); //服务器错误
                return;
            }
            if(result.length !=0){
                res.send("-1"); //数据库里找到用户，result.length>0表示用户名被占用
                return;
            }
            // 设置md5密码
            password = md5( md5(password).substr(4,7) + md5(password) );
            // 若不存在写入
            // 可以证明用户名没有被占用，插入数据库
            db1.insertOne("user",{
                "username":username,
                "password":password,
                "avatar":"default.png" //注册成功后存入默认头像路径
            },function(err,result){
                if(err){
                    res.send("-3"); //服务器错误
                    return;
                }
                //注册成功 写入session
                // session在主文件内引入,当前文件没有变量作用域
                req.session.login = "1";
                req.session.username = username;
                res.send("1"); //写在最后
            })
        })

        
    });
}

// 登录页
exports.showLogin = function(req,res,next){
    res.render("login",{
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : "",
        "active":"登录"
    })
}

// 登录业务
exports.doLogin = function(req,res,next){
    // 查询数据库是否有这个人
    // 如果有对比密码
    var form = new formidable.IncomingForm();
    // 得到用户提交表单
    form.parse(req, function(err, fields, files) {
        var username = fields.username;
        var password = fields.password;
        db1.find("user",{
            "username":username
        },function(err,result){
            if(err){
                res.send("-3");     //服务器错误
                return;
            }
            if(result.length == 0){
                res.send("-1");     //用户不存在
                return;
            }
            // 加密获取的密码 对比密码
            password = md5( md5(password).substr(4,7) + md5(password) );
            if(password ==  result[0].password){
                // 登录成功后记录session
                req.session.login = "1";
                req.session.username = username;
                res.send("1");
                return;
            }else{
                res.send("-2"); //密码错误
                return;
            }
        })
    })

}


// 上传头像 必须保证已经登录
exports.showSetavatar = function(req,res,next){
    if(req.session.login != "1"){
        res.send("非法闯入，必须要登录才可以设置头像");
        return
    }
    res.render("setavatar",{
        "login":true,
        "username":req.session.username,
        "active":"修改头像"
    })
}


// 上传文件。裁切图像
exports.doSetavatar = function(req,res,next){
    var form = new formidable.IncomingForm();
    form.uploadDir = path.normalize(__dirname + "/../avatar" );
    console.log(form.uploadDir)
    form.parse(req, function(err, fields, files) {

        // var extname = path.extname(files.avatar);
        console.log(files)
        console.log(fields)
        
    });
}