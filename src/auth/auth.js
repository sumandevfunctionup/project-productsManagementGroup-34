const jwt = require("jsonwebtoken");

const authentication = function(req, res, next){
    try{
        const token = req.header("Authorization", "Bearer Token")

        if(!token) return res.status(401).send({status:false, msg: "Token must be present"})

        let decodedToken = jwt.verify(token.split(' ')[1], "group-34-productManagement", {ignoreExpiration: true})
        // token => userId, exp , iat
        // invalid token 
        if(!decodedToken) return res.status(401).send({status: false, msg: "Invalid token "})

        let exp = decodedToken.exp
        let timeNow = Math.floor(Date.now() / 1000)
        /// expiration case handle
        if(exp<timeNow) return res.status(401).send({status:false,msg:'Token is expired now'})
        // putting userId in the headers
        req.userId = decodedToken.userId     // to prevent decoding token again 
        next();
    }catch(err){
        console.log(err)
        return res.status(500).send({status: false, msg: err.message})   
     }
}

module.exports.authentication = authentication;