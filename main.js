const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const { Pool, Client } = require('pg');

const pool = new Pool();

//I started using fastify.io instead of express on new projects but since express is the requirement...

app.get('/', (req, res) => {
  res.send('Hello World!');
  pool.query('SELECT NOW()', (err, res) => {
	console.log(res.rows);
  });
});

app.get('/comment', async (req, res, next) => {
	try {
		const articleid = req.query.articleid;

		const dbres=await pool.query(`
			SELECT c.commentid,c.userid,c.created as date,c.body,c.articleid,c.parentcomment, u.username
			FROM comment as c
			JOIN users as u USING(userid)
			WHERE articleid=$1
		`,[articleid]);
		//console.log(dbres);
		res.json(dbres.rows);
	}catch(error){
		return next(error);
	}
});

app.post('/comment', (req, res) => {
	let body = req.body.body;
	pool.query('SELECT NOW()', (err, res) => {
	  console.log(res.rows);

	  res.send('Hello World!');
	});
});

app.put('/upvote', (req, res) => {
	const commentid = req.query.commentid;
	const userid=1;//assume userid 1 logged in
	pool.query('SELECT NOW()', (err, res) => {
	  console.log(res.rows);

	  res.send('Hello World!');
	});
});

app.use(express.static('www'));
app.use(bodyParser.json());
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});