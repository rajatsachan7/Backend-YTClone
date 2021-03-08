const express = require("express");
      cors = require("cors");
      mongodb = require("mongodb");
      bcrypt = require("bcryptjs");
      nodemailer = require('nodemailer');
      randomstring = require("randomstring");

      node = express();
      node.use(express.json());
      node.use(cors());

      URL = "mongodb+srv://admin:admin@youtube-clone.jkxrp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
      DB = "YTClone";




node.get("/users", async (req, res) => {
    let connection = await mongodb.MongoClient.connect(URL);
    let db = connection.db(DB);
    let users = await db.collection("users").find().toArray();
    res.json(users);
});



node.post("/register", async (req, res) => {
    try {
        let salt = await bcrypt.genSalt(10);
        let hashPassword = await bcrypt.hash(req.body.password, salt);
        let newUser = {
            firstname : req.body.fname,
            lastname : req.body.lname,
            email : req.body.email,
            password : hashPassword
        };

        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);
        
        let emailExists = await db.collection("users").find(
            {
                email : req.body.email
            }
        ).toArray();
        
        if(emailExists.length == 0)
        {
            await db.collection("users").insertOne(newUser);
            await connection.close();

            res.status(200).json({
                message : "New user added"
            });
        }
        else
        {
            await connection.close();
            res.status(409).json({
                message : "Email already registered"
            });
        }       

    } catch (error) {
        res.status(500).json({
            message : error
        });
    }
});



node.post("/login", async (req, res) => {
    
    try {
        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);
        
        let user = await db.collection("users").findOne(
            {
                email : req.body.email
            }
        );
        
        if(user)
        {
            let validPassword = await bcrypt.compare(req.body.password, user.password);
            
            if(validPassword)
            {
                await connection.close();
                res.status(200).json({
                    email : user.email,
                    name : user.firstname + " " + user.lastname
                });
            }
            else
            {
                await connection.close();
                res.status(401).json({
                    message : "You have entered the wrong password"
                });
            }
        }
        else
        {
            await connection.close();
            res.status(404).json({ message : "User not found!" });      
        }
    } catch (error) {
        res.status(500).json({
            message : error
        });
    }
});

node.get("/videos", async (req, res) => {
    let connection = await mongodb.MongoClient.connect(URL);
    let db = connection.db(DB);
    let users = await db.collection("videos").find().toArray();
    res.json(users);
});


node.post("/upload", async (req, res) => {
    try {
        let newVideo = {
            name : req.body.name,
            description : req.body.description,
            tags : req.body.tags.split(","),
            user : req.body.user,
            link : req.body.link,
            views : 0,
            comments : [],
            likes : 0,
            dislikes : 0,
            id : req.body.link.split("/").slice(-1)[0]
        };

        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);
        
        await db.collection("videos").insertOne(newVideo);
        await connection.close();

        res.status(200).json({
            message : "Video Uploaded!"
        });      

    } catch (error) {
        res.status(500).json({
            message : error
        });
    }
});



node.post("/delete", async (req, res) => {
    try {

        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);

        await db.collection("videos").findOneAndDelete(
            {
                user : req.body.user,
                link : req.body.link
            }
        );

        await connection.close();

        res.status(200).json({
            message : "Deleted"
        });

    } catch (error){

        res.status(500).json({
            message : error
        });
    }
});



node.post("/edit", async (req, res) => {
    try {

        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);

        await db.collection("videos").updateOne(
            {
                user : req.body.user,
                link : req.body.link
            },
            {
                $set : {
                    name : req.body.name,
                    description : req.body.description,
                    tags : req.body.tags
                }
            }
        );

        await connection.close();
        
        res.status(200).json({
            message : "Edited"
        });

    } catch (error){

        res.status(500).json({
            message : error
        });
    }
});



node.post("/search", async (req, res) => {
    try {

        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);

        let searchResults = await db.collection("videos").find(
            { 
                $or: [
                    {
                        name : {'$regex': req.body.query}
                    },
                    {
                        description : {'$regex': req.body.query}
                    },
                    {
                        tags : {'$regex': req.body.query}
                    },
                    {
                        user : {'$regex': req.body.query}
                    }
                ] 
            }
        ).toArray();

        await connection.close();

        res.status(200).json(searchResults);

    } catch (error){

        res.status(500).json({
            message : error
        });
    }
});



node.post("/channel", async (req, res) => {
    
    try {
        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);
        
        let videos = await db.collection("videos").find(
            {
                user : req.body.email
            }
        ).toArray();
        
        if(videos)
        {
            await connection.close();
            res.status(200).json(videos);
        }
        else
        {
            await connection.close();
            res.status(404).json({ message : "Nothing to display" });      
        }
    } catch (error) {
        res.status(500).json({
            message : error
        });
    }
});


node.post("/comment", async (req, res) => {
    try {

        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);

        await db.collection("videos").updateOne(
            {
                link : req.body.url
            },
            {
                $push : {
                    comments : req.body.comment
                }
            }
        );

        await connection.close();

        res.status(200).json({
            message : "Comment has been added"
        });

    } catch (error){

        res.status(500).json({
            message : error
        });
    }
});



node.post("/like", async (req, res) => {
    try {

        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);

        await db.collection("videos").updateOne(
            {
                link : req.body.url
            },
            {
                $inc: {
                    likes: 1
                }
            }
        );

        await connection.close();

        res.status(200).json({
            message : "liked"
        });

    } catch (error){

        res.status(500).json({
            message : error
        });
    }
});


node.post("/dislike", async (req, res) => {
    try {

        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);

        await db.collection("videos").updateOne(
            {
                link : req.body.url
            },
            {
                $inc: {
                    dislikes: 1
                }
            }
        );

        await connection.close();

        res.status(200).json({
            message : "Disliked"
        });

    } catch (error){

        res.status(500).json({
            message : error
        });
    }
});



node.post("/deleteComment", async (req, res) => {
    try {

        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);

        await db.collection("videos").updateOne(
            {
                link : req.body.url
            },
            {
                $pull: {
                    comments: req.body.comment
                }
            }
        );

        await connection.close();

        res.status(200).json({
            message : "Deleted"
        });

    } catch (error){

        res.status(500).json({
            message : error
        });
    }
});



node.post("/views", async (req, res) => {
    try {

        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);

        await db.collection("videos").updateOne(
            {
                link : req.body.url
            },
            {
                $inc: {
                    views: 1
                }
            }
        );

        await connection.close();

        res.status(200).json({
            message : "Increasing Views"
        });

    } catch (error){

        res.status(500).json({
            message : error
        });
    }
});

let otp = "";
node.post("/resetpassword", async (req, res) => {
    console.log(req.body);
    otp = randomstring.generate(
        {
            length: 10,
            charset: 'alphabetic'
        }
    );

    let mailContent = "Please follow this link to reset your password:" + req.body.email + "/" + otp;

    const mailOptions = {
        from: 'rajat7sachan@gmail.com',
        to: req.body.email,
        subject: 'RESET PASSWORD from YOUTUBE-Clone',
        text: mailContent
    };
      
    transporter.sendMail(mailOptions, function(error, info){
        if (error) 
            res.status(500).json({
                message : error
            });
        else
            res.status(200).json({
                message : 'Email sent: ' + info.response
            });
        
    });
});


node.get("/otp", async (req, res) => {
    res.json({
        otp : otp
    })
});



node.post("/resetpasswordrequest", async (req, res) => {
    try {
        let salt = await bcrypt.genSalt(10);
        let hashPassword = await bcrypt.hash(req.body.password, salt);

        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);
        
        await db.collection("users").updateOne(
            {
                email : req.body.email
            },
            {
                $set : {
                    password : hashPassword
                }
            }
        );

        await connection.close();
        res.status(200).json({
            message : "Password reset successfully"
        }); 

    } catch (error) {
        res.status(500).json({
            message : error
        });
    }
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'rajat7sachan@gmail.com',
      pass: process.env.PASS
    }
});



node.get("/", async (req, res) => {
    res.send("Server Running")
});




node.listen(process.env.PORT || 8080);