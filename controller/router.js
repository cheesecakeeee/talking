var formidable = require('formidable');
var db1 = require("../models/db1.js");
var md5 = require("../models/md5.js");
var path = require("path");
var fs = require("fs");
var gm = require("gm");
var sd = require('silly-datetime'); //时区时间格式

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
    // 检索数据库查头像
    db1.find("user",{username: username},function(err,result){
        if(result.length == 0){ //查找数据库是否有该用户，如果有该用户获取其数据库的头像，若没有就自动渲染初始图片
            var avatar = "ini.png"
        }else{
            var avatar = result[0].avatar;  //用户未更改头像读取的是注册时默认写入的头像地址
        }
        // 检索数据库查说说
        db1.find("post",{},{"sort":{"time":-1}},function(err,result2){
            res.render("index",{
                "login":login,
                "username":username,
                "active":"全部说说",
                "avatar":avatar    //登陆人的头像
                // 列出所有说说交给前台渲染，因此不传递result->shuoshuo
            })
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

exports.doPost = function(req,res,next){
    if(req.session.login != "1"){
        res.send("非法闯入，必须要登录！！");
        return;
    }
    //得到用户名
    var username = req.session.username;
    // 得到用户提交表单
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        //获取提交的内容
        var content = fields.content;
        // 获取对应时区时间
        var time=sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
        //插入数据库
        db1.insertOne("post",{
            "username":username,
            "time":time,
            "content":content
        },function(err,result){
            if(err){
                res.send("-3"); //服务器错误
                return;
            }
            res.send("1"); //发表成功
        })


    });
}

// 列出所有说说

exports.getAllShuoshuo = function(req,res,next){
    // 分页,获取页码
    var page = req.query.page;
    db1.find("post",{},{"sort":{"time":-1},"pageAmount":9,"page":page},function(err,result){
        res.json(result);
    })
}
// 说说列表缺少头像，根据用户名获取用户某些部分的个人信息传回前台
// 获取某个用户信息
exports.getUserInfo = function(req,res,next){
    var username = req.query.username;
    db1.find("user",{"username":username},function(err,result){
        // res.json({"r":result});
        var obj = {
            "username":result[0].username,
            "avatar":result[0].avatar,
            "_id":result[0]._id
        }
        res.json(obj)
    })
}

//获取说说数量ajax服务
exports.getShuoshuoAmount = function(req,res,next){
    db1.getAllCount("post", function (count) {
        res.send(count.toString())
    })
}


// 用户个人主页
exports.showUser = function(req,res,next){
    var user = req.params.user;
    // 查找此人的说说
    db1.find("post",{"username":user},function(err,result){
        db1.find("user",{"username":user},function(err,result2){
            res.render("user",{
                "login":req.session.login == "1"?true:false,
                "username":req.session.login == "1"?req.session.username:"",
                "user": user,
                "active":"我的说说",
                "myshuoshuo":result,
                "myavatar":result2[0].avatar
            })
        })
        
    })
    
}

// 显示用户列表
exports.showUserList = function(req,res,next){
    db1.find("user",{},function(err,result){
        res.render("userlist",{
            "login":req.session.login == "1" ? true : false,
            "username":req.session.login == "1" ? req.session.username : "",
            "active":"成员列表",
            "allmember":result
        })
    })
}