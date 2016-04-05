var mongodb = require('./db');

function Comment(name, day ,title, comment){
    this.name = name;
    this.day = day;
    this.title = title;
    this.comment = comment
}
module.exports = Comment;
//´æ´¢Ò»ÌõÁôÑÔÐÅÏ¢
Comment.prototype.save = function(callback){
    var name = this.name,
        day = this.day,
        title = this.title,
        comment = this.comment;
    //´ò¿ªÊý¾Ý¿â
    mongodb.open(function(err, db){
        if(err)
        {
            return callback(err);
        }
        //¶ÁÈ¡postsÃüÁî
        db.collection('posts', function(err, collection){
            if(err)
            {
                mongodb.close();
                return callback(err)
            }
            //Í¨¹ýÓÃ»§Ãû¡¢Ê±¼äÒÔ¼°±êÌâ²éÕÒÎÄµµ£¬²¢°ÑÒ»ÌõÁôÑÔ¶ÔÏóÌí¼Óµ½¸ÃÎÄµµµÄcommentsÊý×éÀï
            collection.update({
                "name": name,
                "time.day": day,
                "title": title
            },{$push:{"comments":comment}
                }, function(err){
                    mongodb.close();
                    if(err)
                    {
                        return callback(err)
                    }
                    callback(null);
                }
            );
        });
    });
};