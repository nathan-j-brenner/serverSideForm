var express = require('express');
var app = express();
var engines = require('consolidate');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var bodyParser = require('body-parser');

app.engine('html', engines.nunjucks);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));

function errorHandler(err, req, res, next){
    console.error(err.message);
    console.error(err.stack);
    res.status(500).render('error_template', { error: err });
}

MongoClient.connect('mongodb://localhost:27017/movies', (err, db)=>{
    assert.equal(null, err);
    console.log('successfully connected to MongoDB');

    app.get('/', (req, res, next)=>{
        res.render('movieForm', {});
    });

    app.get('/movies', (req, res, next)=>{
        db.collection('title').find({}).toArray((err, docs)=>{
            res.render('movies', { 'movies': docs });
        });
    });

    app.post('/postMovie', (req, res, next)=>{
        var title = req.body.title;
        var year = req.body.year;
        var imdb = req.body.imdb;

        if(typeof title == 'undefined'){
            next("What's the name of the movie?");
        } else if(typeof year == 'undefined') {
            next(`What year was ${title} made in?`);
        } else if(typeof imdb == 'undefined') {
            next(`What is the url at imdb for ${title}?`);
        } else {
            db.collection('title').insertOne({title: title, year: year, imdb: imdb}, (err, result)=>{
                assert.equal(err, null);
                assert.equal(1, result.result.n);
                console.log('Inserted a document into the movies database, title collection');
            });
            res.send(`Movie: ${title}, year: ${year}, imdb: ${imdb}`);
        }
    });

    app.use(errorHandler);

    var server = app.listen(3000, ()=>{
        var port = server.address().port;
        console.log(`Express server is listening on port ${port}`);
    })
});
