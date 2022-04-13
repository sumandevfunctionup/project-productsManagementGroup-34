const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer')
const route = require("./routes/routes");
const mongoose = require('mongoose')
const app = express();

app.use(bodyParser.json()); //  global middlewares content type : application/json
app.use(bodyParser.urlencoded({extended: true}));  //  global middlewares
app.use(multer().any()) 

mongoose.connect("mongodb+srv://sumandev:aBosU15RXTGZYkKq@cluster0.4du2i.mongodb.net/group34Database?retryWrites=true&w=majority", {useNewUrlParser: true})
.then(() => console.log('mongodb running on 27017'))
.catch(err => console.log((err)))

app.use('/', route);

app.listen(process.env.PORT || 3000, function() {
    console.log('Express app running on port '+ (process.env.PORT || 3000))
});