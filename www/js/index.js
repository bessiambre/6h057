import {fromNow,apiCall} from './util.js';
import {UpvoteButton} from './upvotes.js';

const e = React.createElement;

/*
 * This class has some helper functions to efficiently render html views
 * and add reactivity when properties change.
 * See https://benoitessiambre.com/vanilla.html
 */
class ReactiveView {
	constructor(options) {
		options=options || {};
		this.el=document.createElement("div"); //default to a div container
		this.refreshScheduled=false;
		this._properties={};
 
		let properties = this.constructor.properties; //property definitions from subclass
		if(properties!==undefined){
			for (let prop of Object.keys(properties)) {
				this.property(prop);
			}
		}
		this.refresh();
	}
	refresh(){
		//refresh schedules a render at end of current thread
		if(this.refreshScheduled===false){
			this.refreshScheduled=true;
			window.queueMicrotask(()=>this._update());
		}
	}
	_update(){
		this.render();
		this.refreshScheduled=false;
	}
	property(name){
		//add accesors on properties
		Object.defineProperty(this, name, {
			set(v){
				if(this._properties[name]!==v){
					this._properties[name]=v;
					this.refresh();
				}
			},
			get(){return this._properties[name];}
		});
	}
}

/**
 * Event handler to autogrow textareas
 * based on https://stackoverflow.com/a/25621277/433787
 * @param e - DOM element of textarea
 */
function textareainput(e) {
	e.style.height = "auto";
	e.style.height = (e.scrollHeight) + "px";
}

/**
 *  Single comment view
 * */
class CommentView extends ReactiveView{
	static properties={ //properties and their empty options
		comment:{},
		loggedInUser:{},
		showReplyBox:{}
	}
	constructor(options){
		super(options);
		this.comment=options.comment;
		this.loggedInUser=options.loggedInUser;
		this.onChange=options.onChange;
		let template = document.querySelector('#commentTmplt');
		this.el.appendChild(template.content.cloneNode(true));
		this.showReplyBox=false;
	}
	render(){
		//Rendered using vanillajs as per requirements. I would usually use lit-html.
		let comment=this.comment;
		let avatarEl=this.el.querySelector(".avatar");
		avatarEl.src=`img/user${comment.userid}.png`;

		let nameEl = this.el.querySelector(".username");
		nameEl.textContent = comment.username;
		
		let dateEl = this.el.querySelector(".date");
		dateEl.textContent = `• ${fromNow(comment.date)}`;
		
		let bodyEl = this.el.querySelector(".commentbody");
		bodyEl.textContent = comment.body;
		
		let upvoteEl = this.el.querySelector(".upvote");

		const root = ReactDOM.createRoot(upvoteEl);
		root.render(e(UpvoteButton,{upvotes:comment.upvotes,handleClick:()=>this.upvoteClick(comment),upvoted:comment.upvoted}));

		let repliesEl = this.el.querySelector(".replies");
		
		//Recursively load replies
		if(comment.replies.length>0){
			let commentLeftEl=this.el.querySelector(".commentLeft");
			commentLeftEl.classList.add("hasreplies");
			for(let reply of comment.replies){
				let commentView=new CommentView({
					comment:reply,
					loggedInUser:this.loggedInUser,
					onChange:()=>this.onChange() //not necessary with websocket push but just in case push is down
				});
				repliesEl.appendChild(commentView.el);
			}
			repliesEl.style.display = "block";
		}else{
			repliesEl.style.display = "none";
		}

		let replyEl = this.el.querySelector(".reply");
		let commentInputSectionEl=this.el.querySelector(".commentInputSection");
		if(comment.parentcomment!==null){//to limit to one level of nesting remove reply button on 
			replyEl.style.display = "none";
			commentInputSectionEl.style.display = "none";
		}else{
			replyEl.addEventListener("click",()=>this.replyClick());
			//Once the reply button is clicked an textarea input will appear for the reply.
			if(this.showReplyBox===true){
				let textareaEl = this.el.querySelector(".commentinput");
				textareaEl.addEventListener("input", (e)=>textareainput(e.target));
				let usravatarEl= this.el.querySelector(".usravatar");
				usravatarEl.src=`img/user${this.loggedInUser}.png`;
				const commentButEl=this.el.querySelector('.commentBut');
				commentButEl.addEventListener("click",()=>this.commentClick(textareaEl.value));
				commentInputSectionEl.style.display = "flex";
			}else{
				commentInputSectionEl.style.display = "none";
			}
		}
	}
	async upvoteClick(comment){
		let [result] = await apiCall(`/upvote`,{
			method:'PUT',
			json:{
				commentid:comment.commentid,
				userid:this.loggedInUser
			}
		});
		this.onChange(); //this will result reloading the comment section, not really necessary with the websocket push
	}
	replyClick(){
		this.showReplyBox=true;//this is a reactive property so a rerendering will be triggered
	}
	/**Commment button click to save the reply */
	async commentClick(body){
		let [result] = await apiCall(`/comment`,{
			method:'POST',
			json:{
				body:body,
				articleid:1,
				userid:this.loggedInUser,
				parent:this.comment.commentid
			}
		});
		this.showReplyBox=false;
		this.onChange();
	}
}


/**
 * View for list of comments
 */
class CommentsView extends ReactiveView{
	static properties={ //properties and their empty options
		comments: {}, 
		loggedInUser:{}
	};
	constructor(options){
		super(options);
		this.loggedInUser=options.loggedInUser
		this.loadComments();
		this.comments=[];
	}
	render(){
		//Here I would like to use a templating library such as lit-html
		//(see https://benoitessiambre.com/vanilla.html) but since the requirements are vanillajs
		//we will use vanilla with maybe <template> tags.
		this.el.textContent = '';

		for(let comment of this.comments){
			let commentView=new CommentView({
				comment,
				loggedInUser:this.loggedInUser,
				onChange:()=>this.loadComments() //not necessary with websocket push but just in case push is down
			});
			this.el.appendChild(commentView.el);
		}
	}
	async loadComments(){
		let [comments] = await apiCall(`/comment?articleid=${1}&userid=${this.loggedInUser}`);
		this.commentsById={};
		let topComments=[];
		for(let c of comments){
			this.commentsById[c.commentid]=c;
			c.replies=[];
		}
		for(let c of comments){
			if(c.parentcomment!==null){
				this.commentsById[c.parentcomment].replies.push(c);
			}else{
				topComments.push(c);
			}
		}
		this.comments=topComments;
	}
	/** This is called after a push message is received to tell us to refresh a particular comment's upvotes count */
	async refreshUpvotes(commentid){
		let comment=this.commentsById[commentid];
		if(comment){
			let [res] = await apiCall(`/upvote?commentid=${commentid}&userid=${this.loggedInUser}`);
			console.log(res);
			comment.upvotes=res.upvotes;
			comment.upvoted=res.upvoted;
			this.refresh();//since we doing an invisible deep modification to the 'comments' property, a manual refresh is necessary
		}
	}
}


/**
 * Main controller. Manipulates the pure html parts and creates subviews.
 */
class MainController{
	constructor(){
		this.loggedInUser=Math.floor(Math.random()*4)+1;

		this.commentsview=new CommentsView({loggedInUser:this.loggedInUser});
		this.commentsview.el=document.querySelector('#comments'); //attach to the comments holder div

		this.textareaEl = document.querySelector("#commentinput");
		this.textareaEl.addEventListener("input", (e)=>textareainput(e.target));

		const commentButEl=document.querySelector('#commentBut');
		commentButEl.addEventListener("click",()=>this.commentClick());

		const avatarEl=document.querySelector('#usravatar');
		avatarEl.src=`img/user${this.loggedInUser}.png`;

		this.socket = io('/',{query: {articleid:1}});
		this.socket.on("upvote_change",(msg)=>{
			//console.log(msg);
			this.commentsview.refreshUpvotes(msg.commentid);
		});
	}
	async commentClick(){
		let body=this.textareaEl.value;
		let [result] = await apiCall(`/comment`,{
			method:'POST',
			json:{
				body:body,
				articleid:1,
				userid:mainController.loggedInUser
			}
		});
		this.commentsview.loadComments();
	}
}



let main=function(){
	let mainController=new MainController();
};
 
 

//The new "$( document ).ready()"
if (document.readyState != 'loading'){
	main();
} else {
	document.addEventListener('DOMContentLoaded', main);
}
 
