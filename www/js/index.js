

/*
 * ReactiveView
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



class CommentsView extends ReactiveView{
	static properties={
		comments: {} //'comments' property and its empty options
	};
	constructor(){
		super();
		this.comments=[{
			commentid:1,
			username:"Rob Hope",
			date:new Date(),
			body:"Jeepers now that's a huge release with some big community earnings to back it - it must be so rewarding seeing creators quit their day jobs after monetizing (with real MRR) on the new platform.",
			upvotes:1,
			replies:[]
		}];
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
		dateEl.textContent = comment.date.toString();
		
		let bodyEl = clone.querySelector(".commentbody");
		bodyEl.textContent = comment.body;
		
		let upvoteEl = clone.querySelector(".upvote");
		if(comment.upvotes>0){
			upvoteEl.textContent = `${comment.upvotes} ▲ Upvote`;
		}else{
			upvoteEl.textContent = `▲ Upvote`;
		}

		let repliesEl = clone.querySelector(".replies");
    	
    	for(let reply of comment.replies){
			this.renderComment(reply,repliesEl);
		}

    	parentEl.appendChild(clone);
	}
}



let main=function(){
	let commentsview=new CommentsView();
	commentsview.el=document.querySelector('#comments'); //attach to a div inside the html
};
 
 

//The new "$( document ).ready()"
if (document.readyState != 'loading'){
	main();
} else {
	document.addEventListener('DOMContentLoaded', main);
}
 
