import {apiCall} from './util.js';

/**
 * I admit that I'm note very familiar with React, instead having used lit.dev. They are
 * however similar. Following React's tutorial ( https://reactjs.org/docs/add-react-to-a-website.html )
 * seems quite straightforward.
 */

const e = React.createElement;

export class UpvoteButton extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
	let text='▲ Upvote';

	if (this.props.upvotes && this.props.upvotes>0) {
		text= `▲${this.props.upvotes} ${(this.props.upvoted?'Cancel upvote':'Upvote')}`;
	}
	//I could have setup jsx but this would have required a build toolchain. I like the fast iteration pace of a build free setup.
    return e(
      'div',
      { onClick: () => this.props.handleClick() },
      text
    );
  }
}