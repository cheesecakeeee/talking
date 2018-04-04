var MongoClient = require("mongodb").MongoClient;
var setting = require("../settings.js");

function __connectMongoDB(callback){
    var url = setting.dburl;

    MongoClient.connect(url,(err,db)=>{
        if(err){
            console.log("连接失败");
            return;
        }
        // console.log("连接成功");
        callback(err,db)
    })
}

// 传入回调函数，再连接成功后进行一系列操作
// __connectMongoDB(function(err,db){

// });

// 插入操作
exports.insertOne = function(collectionName,json,callback){
    __connectMongoDB(function(err,db){
        db.collection(collectionName).insertOne(json,function(err,result){
            if(err){
                callback(err,null);
                db.close();
                return;
            }
            callback(err,result);
            db.close();
        })
    })
}

// 查找全部；查找的集合，查找到内容，回调函数
// exports.find = function(collectionName,json,callback){
//     var result = [];    
//     if(arguments.length != 3){
//         callback("find函数接收3个参数",null);
//         return;
//     }
//     __connectMongoDB(function(err,db){
//         // 游标指针
//         var cursor = db.collection(collectionName).find(json);
//         // 遍历文档
//         cursor.each(function(err,doc){
//             if(err){
//                 callback(err,null);
//                 return;
//             }
//             // 由于这里如果直接写callback，callback调用次数（几条数据就调用几次）会增多
//             // 因此，用一个空数组存放所有文档，然后再去遍历所有文档
//             if(doc != null){
//                 result.push(doc);
//             }else{
//                 callback(null,result);
//             }
//         })
//     })
// }

//带分页的查找； 查找的集合，查找到内容，分页对象（分页的条目和分页数和排序），回调函数
exports.find = function(collectionName,json,C,D){
    // 用一个空数组存放读取的文档
    var result = [];
    if(arguments.length == 3){
        var callback = C;
        var skipNum = 0;
        var limitNum = 0;
    }else    
    if(arguments.length == 4){
        var callback = D;
        var args = C;
        var skipNum = args.pageAmount*args.page || 0;
        var limitNum = args.pageAmount || 0;
        var sort = args.sort || {};
    }else{
        callback("find函数接收3个或4个参数",null);
        return;
    }
    __connectMongoDB(function(err,db){
        // 游标指针 limit() skip()分页读取数据        时间倒序
        var cursor = db.collection(collectionName).find(json).limit(limitNum).skip(skipNum).sort(sort);
        // 遍历文档
        cursor.each(function(err,doc){
            if(err){
                callback(err,null);
                db.close();
                return;
            }
            // 由于这里如果直接写callback，callback调用次数（几条数据就调用几次）会增多
            // 因此，用一个空数组存放所读取的doc，然后再去遍历展示文档
            if(doc != null){
                result.push(doc);
            }else{
                callback(null,result);
                db.close();
            }
        })
    })
}



// 删除
exports.deleteMany = function(collectionName,json,callback){
    __connectMongoDB(function(err,db){
        db.collection(collectionName).deleteMany(json,function(err,r){
            if(err){
                callback(err,null);
                db.close();
                return;
            }
            callback(err,r);
            db.close();
        })
    })
}


// 修改
exports.updateMany = function(collectionName,json1,json2,callback){
    __connectMongoDB(function(err,db){
        db.collection(collectionName).updateMany(json1,json2,function(err,r){
            if(err){
                callback(err,null);
                db.close();
                return;
            }
            callback(err,r)
            db.close();
        })
    })
}

// 得到数量
exports.getAllCount = function(collectionName,callback){
    __connectMongoDB(function(err,db){
            db.collection(collectionName).count({}).then(function(count){
                callback(count);
                db.close();
            });
    })
}