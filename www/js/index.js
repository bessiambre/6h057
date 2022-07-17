import {fromNow,apiCall} from './util.js';


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
 * Displays list of comments
 */
class CommentsView extends ReactiveView{
	static properties={
		comments: {} //'comments' property and its empty options
	};
	constructor(){
		super();
		this.loadComments();
		this.comments=[];
	}
	render(){
		//Here I would like to use a templating library such as lit-html
		//(see https://benoitessiambre.com/vanilla.html) but since the requirements are vanillajs
		//we will use vanilla with maybe <template> tags.

		this.el.textContent = '';

		for(let comment of this.comments){
			this.renderComment(comment,this.el);
		}
		
	}
	renderComment(comment, parentEl){
		let template = document.querySelector('#commentTmplt');
		let clone = template.content.cloneNode(true);

		let nameEl = clone.querySelector(".username");
		nameEl.textContent = comment.username;
		
		let dateEl = clone.querySelector(".date");
		dateEl.textContent = `• ${fromNow(comment.date)}`;
		
		let bodyEl = clone.querySelector(".commentbody");
		bodyEl.textContent = comment.body;
		
		let upvoteEl = clone.querySelector(".upvote");
		if(comment.upvotes>0){
			upvoteEl.textContent = `▲${comment.upvotes} Upvote`;
		}else{
			upvoteEl.textContent = `▲ Upvote`;
		}

		upvoteEl.addEventListener("click",()=>this.upvoteClick(comment));

		let repliesEl = clone.querySelector(".replies");
		
		if(comment.replies.length>0){
			let commentLeftEl=clone.querySelector(".commentLeft");
			commentLeftEl.classList.add("hasreplies");
			for(let reply of comment.replies){
				this.renderComment(reply,repliesEl);
			}
		}else{
			repliesEl.remove();
		}

    	parentEl.appendChild(clone);
	}
	async loadComments(){
		let [comments] = await apiCall(`/comment?articleid=${1}`);
		let commentsById={};
		let topComments=[];
		for(let c of comments){
			commentsById[c.commentid]=c;
			c.replies=[];
		}
		for(let c of comments){
			if(c.parentcomment!==null){
				commentsById[c.parentcomment].replies.push(c);
			}else{
				topComments.push(c);
			}
		}
		this.comments=topComments;
	}
	async upvoteClick(comment){
		let [result] = await apiCall(`/upvote`,{
			method:'PUT',
			json:{
				commentid:comment.commentid
			}
		});
		this.loadComments();
	}
}

/**
 * The main page was built in pure html in the html page as per specification but an object is still useful for event handling etc.
 */
class MainController{
	constructor(){
		this.commentsview=new CommentsView();
		this.commentsview.el=document.querySelector('#comments'); //attach to the comments holder div

		//make textarea autogrow based on https://stackoverflow.com/a/25621277/433787
		this.textareaEl = document.querySelector("textarea");
		this.textareaEl.addEventListener("input", (e)=>this.textareainput(e.target));

		const commentButEl=document.querySelector('#commentBut');
		commentButEl.addEventListener("click",()=>this.commentClick());
	}
	textareainput(e) {
		e.style.height = "auto";
		e.style.height = (e.scrollHeight) + "px";
	}
	async commentClick(){
		let body=this.textareaEl.value;
		let [result] = await apiCall(`/comment`,{
			method:'POST',
			json:{
				body:body,
				articleid:1
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
 
