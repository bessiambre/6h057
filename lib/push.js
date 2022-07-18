const { Server } = require("socket.io");


class Push{
	constructor(options){

		this.socketsByArticle={};

		this.io = new Server(options.server);

		this.io.on('connection', (socket) => {
			console.log('a user connected');
			if(this.socketsByArticle[socket.handshake.query.articleid]===undefined){
				this.socketsByArticle[socket.handshake.query.articleid]=new Set();
			}
			this.socketsByArticle[socket.handshake.query.articleid].add(socket);
			socket.on('disconnect', () => {
				console.log('user disconnected');
				this.socketsByArticle[socket.handshake.query.articleid].delete(socket);
			});
		});
	}
	pushForArticle(article,name,data){
		let socketset=this.socketsByArticle[article];
		for (const socket of socketset) {
			socket.emit(name,data);
		}
	}
}

module.exports=Push;