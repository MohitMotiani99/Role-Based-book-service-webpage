var express = require('express')
var app = express()
app.use(express.json())
app.use(express.static('public'))
//app.use(express.static('views'))
app.use(express.urlencoded({ extended: true })); 
app.set("view engine",'jade')

var MongoClient=require('mongodb').MongoClient
var url='mongodb://127.0.0.1:27017'
var mydb='users'
var collection='usercollection'

var server = app.listen(8089,()=>{
    console.log('server started')
})

var jwt = require('jsonwebtoken')
function get_token(obj){
     if(obj.role=='admin')
        return jwt.sign(obj,"admin")
     else
        return jwt.sign(obj,"casestudy2")
}
function validate(token_secret){
    return jwt.verify(token_secret.token,token_secret.secret)
}

var curr_user_ts;

MongoClient.connect(url,function(err,db){
    if(err)throw err
    dbo=db.db(mydb)
    console.log(dbo)

    // dbo.createCollection(collection,(err,result)=>{
    //     console.log(result)
    //     console.log('collection created')
    // })
    app.get('/logout',(req,res)=>{
        res.sendFile(__dirname+'//public//login.html')
    })
    app.post('/login',(req,res)=>{
        var data = req.body
        console.log(data)
        console.log("Data recieved "+data.username+" "+data.password+" "+data.role)
        dbo.collection(collection).find(data).toArray((err,result)=>{
            if(result.length==0)
            res.render('error.jade',{'msg':'Username NOT Found'})
            else{
            curr_user_ts=result[0].token_secret
            console.log('from login')
            console.log(curr_user_ts)
            res.redirect('/bookstore')
            }
            //res.send(result[0].token_secret)
        })
    })
    app.post('/register',(req,res)=>{
        var data=req.body
        
        dbo.collection(collection).find({"username":data.username}).toArray((err,result)=>{
            if(err)
            throw err
            if(result.length!=0)
            res.render('error.jade',{'msg':'Duplicate username not Allowed'})
            else{
            console.log(data)
            var token=get_token(data)
            
            console.log(token)
            var token_secret;
            if(data.role=='admin'){
                token_secret={
                    'token':token,
                    'secret':'admin'
                }
            }
            else{
                token_secret={
                    'token':token,
                    'secret':'casestudy2'
                }
            }
            curr_user_ts=token_secret
            var user_obj={
                'username':data.username,
                'password':data.password,
                'role':data.role,
                'token_secret':token_secret,
                'books':[]
            }

            console.log(user_obj)

            dbo.collection(collection).insertOne(user_obj,(err,result)=>{
                if(err)throw err
                console.log('in here reg')
                console.log(result)
            })
            
            res.redirect('/login.html')
        //res.send('Record Inserted '+user_obj)
            }
        })
        
        
    })
    app.get('/bookstore',(req,res)=>{

        //var data = req.body
        //var token_secret=data.token_secret
        console.log('from store')
        console.log(curr_user_ts)
        var user = validate(curr_user_ts)
        console.log(user)

        var query={
            'username':user.username,
            'password':user.password
        }

        dbo.collection(collection).find(query).toArray((err,result)=>{
            console.log(result)
            console.log(result[0].books)
            res.render('bookops.jade',{bookresult:result[0].books,curr_user:curr_user_ts})
        })
        //res.send('recieved all books')
    })
    app.post('/bookstore/add',(req,res)=>{
        var data = req.body
        console.log(data)
        console.log(data.token_secret)
        var token_secret = JSON.parse(data.token_secret)
        var user = validate(token_secret)
        console.log(user)

        var upd_select={
            'username':user.username,
            'password':user.password
        }
        var upd={
            $push:{
                'books':{
                    'bookname':data.bookname,
                    'price':data.price,
                    'author':data.author
                }
            }
        }

        dbo.collection(collection).updateOne(upd_select,upd,(err,result)=>{
            if(err)
            throw err
            console.log(result)
        })
        res.redirect('/bookstore')
        //res.send('book added')
    })
    app.post('/bookstore/rembookName',(req,res)=>{
        var data = req.body
        console.log(data)
        var token_secret = JSON.parse(data.token_secret)
        var user = validate(token_secret)
        console.log(user)

        var upd_select={
            'username':user.username,
            'password':user.password
        }
        var upd={
            $pull:{
                'books':{
                    'bookname':data.bookname
                }
            }
        }
        dbo.collection(collection).updateMany(upd_select,upd,(err,result)=>{
            if(err) throw err
            console.log(result)
        })
        res.redirect('/bookstore')
        //res.send('book removed')
    })
    app.post('/bookstore/updbookPrice',(req,res)=>{
        var data=req.body
        var token_secret = JSON.parse(data.token_secret)
        var user = validate(token_secret)

        console.log(user)
        if(user.role=='admin'){
        var upd_sel={
            'username':user.username,
            'password':user.password,
            'books.bookname':data.bookname
        }
        var upd={
            $set:{
                'books.$.price':data.price
            }
        }

        dbo.collection(collection).updateMany(upd_sel,upd,(err,result)=>{
            if(err) throw err
            console.log(result)
        })
        res.redirect('/bookstore')
      }
      else{
          res.render('error.jade',{'msg':'You are not a ADMIN'})
      }   
        //res.send('book price updated')
    })
    app.post('/bookstore/updbookAuthor',(req,res)=>{
        var data=req.body
        var token_secret = JSON.parse(data.token_secret)
        var user = validate(token_secret)

        console.log(user)

        var upd_sel={
            'username':user.username,
            'password':user.password,
            'books.bookname':data.bookname
        }
        var upd={
            $set:{
                'books.$.author':data.author
            }
        }

        dbo.collection(collection).updateMany(upd_sel,upd,(err,result)=>{
            if(err) throw err
            console.log(result)
        })
        res.redirect('/bookstore')
        //res.send('book price updated')
    })

})

// app.post('/login',(req,res)=>{

// })