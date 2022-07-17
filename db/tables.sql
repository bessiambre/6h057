

CREATE TABLE sch6h057.users (
	userid SERIAL PRIMARY KEY,
	username text
)
INSERT INTO sch6h057.users (userid,username) VALUES (1, 'Rob Hope');
INSERT INTO sch6h057.users (userid,username) VALUES (2, 'Sophie Brecht');
INSERT INTO sch6h057.users (userid,username) VALUES (3, 'James');
INSERT INTO sch6h057.users (userid,username) VALUES (4, 'Cameron Lawrence');

CREATE TABLE sch6h057.article(
	articleid BIGSERIAL PRIMARY KEY
)
INSERT INTO sch6h057.article (articleid) VALUES (1);


CREATE TABLE sch6h057.comment (
	commentid BIGSERIAL PRIMARY KEY,
	userid integer NOT NULL REFERENCES sch6h057.users(userid) ON DELETE CASCADE,
	created timestamptz,
	body text,
	articleid bigint NOT NULL REFERENCES sch6h057.article(articleid) ON DELETE CASCADE,
	parentcomment bigint --in case we want to thread
)
INSERT INTO sch6h057.comment (userid,created,body,articleid,parentcomment)
VALUES (
	1,
	NOW()-'45 min'::interval,
	'Jeepers now that''s a huge release with some big community earnings to back it - it must be so rewarding seeing creators quit their day jobs after monetizing (with real MRR) on the new platform.',
	1,
	NULL
),
(
	2,
	NOW()-'1 day'::interval,
	'Switched out blog from Hubspot to Ghost a year ago -- turned out to be a great decision. Looking forward o this update....the in-platform analytics look especially delicious. :) ',
	1,
	NULL
),
(
	3,
	NOW()-'3 week'::interval,
	'Love the native memberships and the zipless themes, I was just asked by a friend about options for a new site, and I thik I know what I''ll be recommending then...',
	1,
	NULL
);
INSERT INTO sch6h057.comment (userid,created,body,articleid,parentcomment)
VALUES (
	1,
	NOW()-'2 hour'::interval,
	'Thanks Sophie! Last year has been an absolute goldrush for the creator economy. Slowly at first then all at once. Will be interesting to see how this ecosystem evolves over the next few years',
	1,
	2
);


CREATE TABLE sch6h057.upvote(
	commentid integer NOT NULL,
	userid integer NOT NULL REFERENCES sch6h057.users(userid) ON DELETE CASCADE,
	PRIMARY KEY(commentid,userid)
)