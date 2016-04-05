var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var Comment = require('../models/comment.js');
var express = require('express');
var router = express.Router();
var app = express();
var passport = require('passport');
app.use(function(req, res){
	res.render("404");
});
/* GET home page. */
function checkLogin(req, res, next){
  if(!req.session.user)
  {
  	req.flash('error','未登录！');
  	res.redirect('/login');
  }
  next();
}
function checkNotLogin(req, res, next){
  if(req.session.user)
  {
  	req.flash('error','已登录！');
  	res.redirect('back');//返回之前的页面
  }
  next();
}

module.exports = function(app){

	app.get('/',function(req,res){
		var page = req.query.p?parseInt(req.query.p):1;
		Post.getTen(null, page, function(err, posts, total){
			if (err)
			{
				posts = [];
			}

			res.render('index',{
			title:'主页',
			user: req.session.user,
			posts: posts,
			page: page,
			isFirstPage: (page-1)==0,
			isLastPage: ((page-1)*10+posts.length)==total,
			success: req.flash('success').toString(),
			error:  req.flash('error').toString()

			});

		});//console.log(req.flash('username').toString());
	});
	app.get('/reg',checkNotLogin);
	app.get('/reg',function(req,res){
		res.render('reg',{
			title:'注册',
     		user: req.session.user,
	        success: req.flash('success').toString(),
			error:  req.flash('error').toString()
		});
		
	});
    app.post('/reg',checkNotLogin);
	app.post('/reg',function(req,res){


		if(req.body['password-repeat']!=req.body['password'])
		{
			req.flash('error','两次输入口令不一致');

			return res.redirect('/reg');
        }
				//	生成口令的散列值

		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('base64');
		var newUser = new User({
			name: req.body.username,
			password: password,
			email: req.body.email
		});

 		 //检查用户名是否已经存在 
  		User.get(newUser.name, function(err, user) { 
    
    		if (user) 
      		err = '用户名已经存在.'; 
   			if (err)
   			{ 
      			req.flash('error', err); 
      			return res.redirect('/reg'); 
    		} 

            //如果不存在则新增用户 
    		newUser.save(function(err,user) { 
      			if (err) 
      			{ 
       	 			req.flash('error', err); 
       	 			return res.redirect('/reg'); 
     			} 

      			req.session.user = user; 
      			req.flash('success', '注册成功'); 

      			res.redirect('/');  
    		}); 
  
  		});
	});
	app.get('/login',checkNotLogin);
	app.get('/login',function(req,res){
		res.render('login',{
			title:'登登',
        user: req.session.user,
        success:req.flash('success').toString(),
        error: req.flash('error').toString()
		});
		
	});
	app.get("/login/github", passport.authenticate("github", {session: false}));
    app.get("/login/github/callback", passport.authenticate("github", {
        session: false,
        failureRedirect: '/login',
        successFlash: '登陆成功！'
         }), function (req, res) {
         req.session.user = {name: req.user.username, head: "https://gravatar.com/avatar/" + req.user._json.gravatar_id + "?s=48"};
         res.redirect('/');
    });
	app.post('/login',checkNotLogin);
	app.post('/login',function(req,res){
		var md5 = crypto.createHash('md5'),
		password = md5.update(req.body.password).digest('base64');
		//check user exist
		User.get(req.body.name,function(err,user)
		{
			if(!user)
			{
				req.flash('error','用户名不存在');
				return res.redirect('/login');
			}
			//check password 
			if(user.password != password)
			{
				req.flash('error','密码错误');
				return res.redirect('/login');

			}
			req.session.user = user;
			req.flash('success','登陆成功');
			res.redirect('/');
		});
	});	
	app.get('/post',checkLogin);
	app.get('/post',function(req,res){
		res.render('post',{
			title:'发表',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.post('/post',checkLogin);
	app.post('/post',function(req,res){
		var currentUser = req.session.user;
		tags = [req.body.tag1, req.body.tag2, req.body.tag3],
		post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
		post.save(function (err){
			if(err)
			{
				req.flash('error',err);
				return res.redirect('/');
			}
			req.flash('success','发布成功！');
			res.redirect('/')
		});
	});	
	app.get('/logout',checkLogin);
	app.get('/logout',function(req,res){
		req.session.user = null;
		req.flash('success','登出成功');
		res.redirect('/')		
	});	
	app.get('/upload', checkLogin);//只有登陆的用户才能上传头像
	app.get('/upload', function(req,res){
		res.render('upload',{
			title:'文件上传',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.get('/u/:name',function(req,res){
		//检查用户名是否存在
		var page = req.query.p?parseInt(req.query.p):1;
		User.get(req.params.name, function(err, user){
			if(!user)
			{
				req.flash('error', '用户名不存在');
				return res.redirect('/');
			}
			//查询并返回该用户第page页的10篇文章
			Post.getTen(user.name, page, function(err,posts, total){
				if(err)
				{
					req.flash('error', err);
					return res.redirect('/');
				}
				res.render('user',{
					title: user.name,
					posts: posts,
					user: req.session.user,
					page: page,
					isFirstPage: (page-1)==0,
					isLastPage: ((page-1)*10+posts.length)==total,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		});
	});	
	app.get('/p/:_id', function(req, res){
		Post.getOne(req.params._id, function(err, post){
			if(err)
			{
				req.flash('error',err);
				return res.redirect('/')
			}
			res.render('article',{
				title: post.title,
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.post('/u/:name/:day/:title', function(req, res){
		var date = new Date(),
			time = date.getFullYear()+"-"+(date.getMonth() + 1)+"-"+date.getDate()+" "+
					date.getHours()+":"+(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes());
        var md5 = crypto.createHash('md5'),
            email_MD5 = md5.update(req.body.email.toLowerCase()).digest('base64');
            head = "http://www.gravatar.com/avatar/"+ email_MD5 +"?s=48";
		var comment={
			name: req.body.name,
			head: head,
			email: req.body.email,
			website: req.body.website,
			time: time,
			content: req.body.content
		};
		var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
		newComment.save(function(err){
			if(err)
			{
				req.flash('error',err);
				return res.redirect('back')
			}
			req.flash('success','留言成功');
			req.flash('back');
		});
	});
	app.get('/edit/:name/:day/:title', checkLogin);
	app.get('/edit/:name/:day/:title', function(req, res){
		var currentUser = req.session.user;
		Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post){
			if(err)
			{
				req.flash('error',err);
				return res.redirect('back')
			}
			res.render('edit',{
				title: '编辑',
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});	
	});

	app.post('/edit/:name/:day/:title', checkLogin);
	app.post('/edit/:name/:day/:title', function(req, res){
		var currentUser = req.session.user;
		Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function(err){
			var url = encodeURI('/u/' + req.params.name +'/'+req.params.day +'/'+
				req.params.title);
			if(err)
			{
				req.flash('error',err);
				return res.redirect('url')
			}
			req.flash('success',"修改成功");
			res.redirect('url')
		});	
	});	
	app.get('/remove/:name/:day/:title', checkLogin);
	app.get('/remove/:name/:day/:title', function(req, res){
		var currentUser = req.session.user;
		Post.remove(currentUser.name, req.params.day, req.params.title, function(err){
			if(err)
			{
				req.flash('error',err);
				return res.redirect('back');
			}
			req.flash('success','删除成功');
			res.redirect('/');
		});	
	});	

	app.get('/tags', function (req, res) {
		Post.getTags(function(err, posts){
			if(err)
			{
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('tags',{
				title: '标签',
				posts: posts,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.get('/tags/:tag', function (req, res) {
		Post.getTag(req.params.tag, function(err, posts){
			if(err)
			{
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('tag',{
				title: 'TAG:'+req.params.tag,
				posts: posts,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

    app.get('/search', function(req, res){
    	Post.search(req.query.keyword, function(err, posts){
    		if(err)
    		{
    			req.flash('error', err);
    			return res.redirect('/')
    		}
    		res.render('search',{
    			title:"SEARCH:" + req.query.keyword,
    			posts:posts,
    			user: req.session.user,
    			success:req.flash('success').toString(),
    			error: req.flash('error').toString()
    		});
    	});
    });
    app.get('/links', function(req, res){
    	res.render('links',{
    		title: '友情链接',
    		user: req.session.user,
    		success:req.flash('success').toString(),
    		error: req.flash('error').toString()
    	});
    });
};
