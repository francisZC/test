var mongodb = require('./db');
var ObjectID = require('mongodb').ObjectID;

function Post(name, head, title, tags, post){
	this.name = name;
	this.title = title;
	this.tags = tags;
	this.post = post;
	this.head = head
}


module.exports = Post;

//´æ´¢Ò»ÆªÎÄÕÂÒÔ¼°Ïà¹ØÐÅÏ¢
Post.prototype.save = function(callback){
	var date = new Date();
	//´æ´¢¸÷ÖÖÊ±¼ä¸ñÊ½£¬ÒÔ±ãÒÔºóÀ©Õ¹
	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear()+ "-"+(date.getMonth()+1),
		day :  date.getFullYear()+ "-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()
		+":"+ (date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())
	}
	//Òª´æÈëÊý¾Ý¿âµÄÎÄµµ
	var post = {
		name: this.name,
		head: this.head,
		time: time,
		title: this.title,
		tags: this.tags,
		post: this.post,
		comments: [],
		reprint_info:{},
		pv: 0
	};
	//´ò¿ªÊý¾Ý¿â
	mongodb.open(function(err,db){
		if(err)
		{
			return callback(err);
		}
		//¶ÁÈ¡posts¼¯ºÏ
		db.collection('posts',function(err, collection){
			if(err)
			{
				mongodb.close();
				return callback(err);
			}
			//½«ÎÄµµ²åÈëposts¼¯ºÏ
			collection.insert(post, {
				safe: true
			},function(err){
					mongodb.close();
					if(err)
					{
						return callback(err);
					}
					callback(null);
				}
			);
		});
	});
};
//¶ÁÈ¡ÎÄÕÂÏà¹ØÐÅÏ¢
Post.getTen=function(name, page, callback){
	//´ò¿ªÊý¾Ý¿â
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//¶ÁÈ¡
		db.collection('posts',function(err, colletction){
			if(err)
			{
				mongodb.close();
				return callback(err);
			}
			var query = {};
			if(name)
			{
				query.name = name;
			}
			//Ê¹ÓÃcount·µ»ØÌØ¶¨²éÑ¯µÄÎÄµµÊýtotal
			colletction.count(query, function(err, total){
				//¸ù¾Ýquery¶ÔÏó²éÑ¯£¬²¢Ìø¹ýÇ°£¨page-1£©x10¸ö½á¹û£¬·µ»ØÖ®ºóµÄ10¸ö½á¹û
				colletction.find(query, {skip:(page-1)*10,
				limit:10}).sort({
					time : -1
				}).toArray(function(err, docs){
					mongodb.close();
					if(err)
					{
						return callback(err);//Ê§°Ü ·µ»Øerr
					}
					//½âÎömarkdownÎªhtml
					// docs.forEach(function(doc){
					// 	docs.post = markdown.toHTML(doc.post);
					// });
					callback(null, docs, total);//³É¹¦£¬ÒÔÊý×éÐÎÊ½·µ»Ø²éÑ¯½á¹û
					});

			});
		});
	});
};
Post.getOne= function(_id, callback){
	mongodb.open(function(err, db){
		if(err)
		{
			return callback(err)
		}
		//¶ÁÈ¡posts¼¯ºÏ
		db.collection('posts', function(err, collection){
			if(err)
			{
				mongodb.close();
				return callback(err);
			}
			//¸ù¾ÝÓÃ»§Ãû¡¢·¢±íÈÕÆÚ¡¢ÒÔ¼°ÎÄÕÂÃû½øÐÐ²éÑ¯
			collection.findOne({
				"_id": new ObjectID(_id)

			},function(err, doc){
				
				if(err){
					mongodb.close();
					return callback(err);
				}
				//½âÎömarkdownÎªhtml
				if(doc)
				{
					collection.update({
				    "_id": new ObjectID(_id)

					},{
						$inc:{"pv":1}
					}, function(err){
						mongodb.close();
						if(err)
						{
							return callback(err)
						}
					});

				}
				
				callback(null, doc);//·µ»Ø²éÑ¯µÄÒ»Æ¬ÎÄÕÂ
			});
		});
	});
};
//·µ»ØÔ­Ê¼·¢±íµÄÄÚÈÝ£¨markdown¸ñÊ½£©
Post.edit= function(name, day, title, callback){
	mongodb.open(function (err, db) {
		if(err)
		{
			return callback(err);
		}
		//¶ÁÈ¡posts¼¯ºÏ
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err)
			}
			//¸ù¾ÝÓÃ»§Ãû¡¢·¢±íÈÕÆÚÒÔ¼°ÎÄÕÂÃû½øÐÐ²éÑ¯
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function (err, doc) {mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, doc);//·µ»Ø²éÑ¯µÄÒ»ÆªÎÄÕÂ

			});
		});
	});
};
Post.update = function(name, day, title, post, callback){
	mongodb.open(function(err, db){
		if(err)
		{
			return callback(err)
		}
		db.collection('posts', function(err, collection){
			if(err)
			{
				mongodb.close();
				return callback(err)
			}
			collection.update({
				"name": name,
				"time.day": day,
				"title": title

			},{
				$set:{post: posts}
			},function(err){
				mongodb.close();
				if(err)
				{
					return callback(err);
				}
				callback(null);
			});
		});
	});
};
Post.remove = function(name, day, title, callback){
	mongodb.open(function(err, db){
		if(err)
		{
			return callback(err)
		}
		db.collection('posts', function(err, collection){
			if(err)
			{
				mongodb.close();
				return callback(err)
			}
			//²éÑ¯ÒªÉ¾³ýµÄÎÄµµ
	
			collection.remove({
				"name": name,
				"time.day": day,
				"title": title
			},{
				w: 1
			},function(err){
				mongodb.close();
				if(err)
				{
					return callback(err)
				}
				callback(null);
			});
		});
	});
};
//·µ»ØËùÓÐ±êÇ©
Post.getTags = function(callback){
	mongodb.open(function (err, db) {
		if(err)
		{
			return callback(err)
		}
		db.collection('posts', function (err, collection) {
			if(err)
			{
				mongodb.close();
				return callback(err);
			}
			//distinctÓÃÀ´ÕÒ³ö¸ø¶¨¼üµÄËùÓÐ²»Í¬Öµ
			collection.distinct("tags", function (err, docs) {
				
				if(err)
				{   mongodb.close();
					return callback(err)
				}
				callback(null, docs)
			});
		});
	});
};
//·µ»Øº¬ÓÐÌØ¶¨±êÇ©µÄËùÓÐÎÄÕÂ
Post.getTag = function(tag, callback){
	mongodb.open(function (err, db) {
		if(err)
		{
			return callback(err)
		}
		db.collection('posts', function (err, collection) {
			if(err)
			{
				mongodb.close();
				return callback(err);
			}
			//²éÑ¯ËùÓÐtagsÊý×éÄÚ°üº¬tagµÄÎÄµµ
			//²¢·µ»ØÖ»º¬ÓÐname, time, title×é³ÉµÄÊý×é
			collection.find({"tags":tag}, 
				{"name":1,
				 "time":1,
				 "title":1}

				).sort({time:-1}).toArray(function(err, docs){
					mongodb.close();
					if(err)
					{
						return callback(err)
					}
					callback(null, docs);
				});
			
		});
	});
};
//·µ»ØÍ¨¹ý±êÌâ¹Ø¼ü×Ö²éÑ¯µÄËùÓÐÎÄÕÂÐÅÏ¢
Post.search = function  (keyword, callback) {
	// body..
	mongodb.open(function  (err, db) {
		// body...
		if(err)
		{
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err)
			{
				mongodb.close();
				return callback(err)
			}
			var pattern = new RegExp(keyword, "i");
			collection.find({
				"title": pattern
			},{"name":1,
			   "time":1,
			   "title":1
 
		}).sort({
			time:-1
		}).toArray(function  (err, docs) {
			// body...
			
			if(err)
			{
				mongodb.close();
				return callback(err);
			}
			callback(null, docs);
			});
		});
	});
};