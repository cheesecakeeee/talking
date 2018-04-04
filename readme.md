# 用户论坛小案例
## 主要功能：
### 可以注册登录
### 发表说说，按时间分页展示
### 用户可以上传个人头像
### 用户可以查看所有的说说，所有人可见
### 用户可以对说说进行评论和点赞

--------
# 数据库collection设计
 **user 集合**——存放用户信息  

{ _oid:"XXXX","username":"xxx","password":"md5加密","avator":"图片地址","sign":"一句话介绍自己" }  
{ _oid:"XXXX","username":"xxx","password":"md5加密","avator":"图片地址","sign":"一句话介绍自己" }  
{ _oid:"XXXX","username":"xxx","password":"md5加密","avator":"图片地址","sign":"一句话介绍自己" }  

**post集合**——存放发表的说说  

{ _oid:"XXXX" , "title":"标题" , "content":"内容" , "author":"作者" , "date":"日期" , "comment":[  

    {
        "comment":"评论内容",
        "author":"评论人",
        "date":"评论日期"
    },  
    {
        "comment":"评论内容",
        "author":"评论人",
        "date":"评论日期"
    },  
    {
        "comment":"评论内容",
        "author":"评论人",
        "date":"评论日期"
    }
] ,   
"zan":["点赞的人","点赞的人","点赞的人"]}

comment 集合
    {
        "comment":"评论内容",
        "author":"评论人",
        "date":"评论日期"
    }