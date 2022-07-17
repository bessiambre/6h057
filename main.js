const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const { Pool, Client } = require('pg');

const pool = new Pool();

//I started using fastify.io instead of express on new projects but since express is the requirement...

app.use(bodyParser.json());

app.get('/', (req, res) => {
	res.redirect('/index.html');
});

app.get('/comment', async (req, res, next) => {
	try {
		const articleid = req.query.articleid;

		const dbres=await pool.query(`
			SELECT 
			c.commentid,
			c.userid,
			c.created as date,
			c.body,
			c.articleid,
			c.parentcomment,
			u.username,
			(SELECT count(*) FROM upvote WHERE commentid=c.commentid) as upvotes
			FROM comment as c
			JOIN users as u USING(userid)
			WHERE articleid=$1
			ORDER BY date DESC
		`,[articleid]);
		//console.log(dbres);
		res.json(dbres.rows);
	}catch(error){
		return next(error);
	}
});

app.post('/comment', async(req, res,next) => {
	try {
		const body = req.body.body;
		const articleid = req.body.articleid;
		const userid=1;//assume userid 1 logged in
		let dbres=await pool.query(`
		INSERT INTO comment (userid,created,body,articleid,parentcomment)
		VALUES (
			$1,
			NOW(),
			$2,
			$3,
			NULL
		)`,[userid,body,articleid]);

		res.json({ok:true});

	}catch(error){
		return next(error);
	}
});

app.put('/upvote', async(req, res,next) => {
	try {
		const commentid = req.body.commentid;
		const userid=1;//assume userid 1 logged in
		const dbres=await pool.query(`
			INSERT INTO upvote (commentid,userid) VALUES ($1,$2)
			ON CONFLICT DO NOTHING
			RETURNING commentid
		`,[commentid,userid]);

		if(dbres.rows.length===0){
			//was aready upvoted, reverse the upvote
			const dbres2=await pool.query(`
				DELETE FROM upvote WHERE commentid=$1 AND userid=$2
			`,[commentid,userid]);
		}

		res.json({ok:true});
	}catch(error){
		return next(error);
	}
});

app.use(express.static('www'));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});