var formidable = require('formidable');
var db1 = require("../models/db1.js");
var md5 = require("../models/md5.js");
var path = require("path");
var fs = require("fs");
var gm = require("gm");


// 首页
exports.showIndex = function(req,res,next){
    // 判断是否登录，决定后台渲染模板传递的数据状态
    if(req.session.login == "1"){
        var username = req.session.username;
        var login = true;

    }else{
        var username = "";
        var login = false;
    }
    db1.find("user",{username: username},function(err,result){
        if(result.length == 0){ //查找数据库是否有该用户，如果有该用户获取其数据库的头像，若没有就自动渲染初始图片
            var avatar = "ini.png"
        }else{
            var avatar = result[0].avatar;  //用户未更改头像读取的是注册时默认写入的头像地址
        }
        res.render("index",{
            "login":login,
            "username":username,
            "active":"首页",
            "avatar":avatar
        })
    })
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
        res.send("非法闯入，必须要登录！！");
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
    if(req.session.login != "1"){
        res.send("非法闯入，必须要登录！！");
        return;
    }
    var form = new formidable.IncomingForm();
    form.uploadDir = path.normalize(__dirname + "/../avatar" );
    form.parse(req, function(err, fields, files) {
        //获取后缀
        var extname = path.extname(files.avatar.name);
        //console.log(files);
        var oldpath = files.avatar.path;
        var newpath = path.normalize(__dirname + "/../avatar/"+req.session.username+extname );;
        fs.rename(oldpath , newpath , function (err) {
            if(err){
                res.send("失败");
                return;
            }
            //res.send("头像上传成功");
            //重定向跳转到裁切图像页面,切的业务
            //裁切的页面来自缓存，用session暂存一下头像等下读取上传裁切头像
            req.session.avatar = req.session.username + extname;
            res.redirect("/crop");
        })
    });
}

//显示裁切
exports.showCrop = function (req,res,next) {
    if(req.session.login != "1"){
        res.send("非法闯入，必须要登录！！");
        return;
    }
    res.render("crop",{
        avatar: req.session.avatar
    })
}

//执行裁切
exports.doCrop = function(req,res,next){
    if(req.session.login != "1"){
        res.send("非法闯入，必须要登录！！");
        return;
    }
    var filename = req.session.avatar;
    var w = req.query.w;
    var h = req.query.h;
    var x = req.query.x;
    var y = req.query.y;
    gm("./avatar/"+filename)
        .crop(w,h,x,y)
        .resize(100, 100,"!")
        .write("./avatar/"+filename,function(err){
            if(err){
                res.send("-1")
                return;
            }else{
                //裁切成功后更新数据库
                db1.updateMany("user",{"username":req.session.username},{
                    $set:{"avatar":req.session.avatar}
                },function(err,result){
                    res.send("1")
                })
            }   
        })
    
}
