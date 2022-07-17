const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const Push = require('./lib/push.js');

const app = express();
const server = http.createServer(app);
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
		const userid = req.query.userid;

		const dbres=await pool.query(`
			SELECT 
			c.commentid,
			c.userid,
			c.created as date,
			c.body,
			c.articleid,
			c.parentcomment,
			u.username,
			(SELECT count(*)::integer  FROM upvote WHERE commentid=c.commentid) as upvotes,
			EXISTS (SELECT 1 FROM upvote WHERE commentid=c.commentid AND userid=$2) as upvoted
			FROM comment as c
			JOIN users as u USING(userid)
			WHERE articleid=$1
			ORDER BY date DESC
		`,[articleid,userid]);
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
		const userid=req.body.userid;
		const parent=req.body.parent;
		let dbres=await pool.query(`
		INSERT INTO comment (userid,created,body,articleid,parentcomment)
		VALUES (
			$1,
			NOW(),
			$2,
			$3,
			$4
		)`,[userid,body,articleid,parent]);

		res.json({ok:true});

	}catch(error){
		return next(error);
	}
});

app.put('/upvote', async(req, res,next) => {
	try {
		const commentid = req.body.commentid;
		const userid=req.body.userid;
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

		const dbres3=await pool.query(`
			SELECT articleid FROM comment WHERE commentid=$1
		`,[commentid]);

		push.pushForArticle(dbres3.rows[0].articleid,"upvote_change",{commentid});

		res.json({ok:true});
	}catch(error){
		return next(error);
	}
});

/**
 * Get upvote count for a single comment
 */
app.get('/upvote', async(req, res,next) => {
	try {
		const commentid = req.query.commentid;
		const userid = req.query.userid;
		const dbres=await pool.query(`
			SELECT
				(SELECT count(*)::integer  FROM upvote WHERE commentid=$1) as upvotes,
				EXISTS (SELECT 1 FROM upvote WHERE commentid=$1 AND userid=$2) as upvoted
		`,[commentid,userid]);

		res.json(dbres.rows[0]);

	}catch(error){
		return next(error);
	}
});

app.use(express.static('www'));

const push = new Push({server});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});