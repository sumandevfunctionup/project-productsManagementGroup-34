const express = require('express');
var bodyParser = require('body-parser');

const route = require("./routes/routes");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const mongoose = require('mongoose')

mongoose.connect("mongodb+srv://sumandev:aBosU15RXTGZYkKq@cluster0.4du2i.mongodb.net/group34Database?retryWrites=true&w=majority", {useNewUrlParser: true})
.then(() => console.log('mongodb running on 27017'))
.catch(err => console.log((err)))

app.use('/', route);

app.listen(process.env.PORT || 3000, function() {
    console.log('Express app running on port '+ (process.env.PORT || 3000))
});