import React, { Component } from 'react';
import randomstring from 'randomstring';
import Peer from 'peerjs';
import logo from './img/logo.png';
import './App.css';

class App extends Component {
  constructor(props) {
		super(props);
		// TODO: when peer is not in the state, render didn't work well.
    this.state = {
      peer: new Peer({key: this.props.opts.peerjsKey}), //for testing
			/*
			//for production:
			peer = new Peer({
			  host: 'yourwebsite.com', port: 3000, path: '/peerjs',
			  debug: 3,
			  config: {'iceServers': [
			    { url: 'stun:stun1.l.google.com:19302' },
			    { url: 'turn:numb.viagenie.ca', credential: 'muazkh', username: 'webrtc@live.com' }
			  ]}
			})
			*/
			myId: '',
			peerId: '',
			initialized: false,
			files: [],
			conn: null,
		};
  }

	componentWillMount() {
		this.state.peer.on('open', (id) => {
			console.log('My peer ID is: ' + id);
			this.setState({
				myId: id,
				initialized: true
			});
		});

		this.state.peer.on('connection', (connection) => {
			console.log('someone connected');
			console.log(connection);

			this.setState({
				conn: connection
			}, () => {
				this.state.conn.on('open', () => {
					this.setState({
						connected: true
					});
				});

				this.state.conn.on('data', this.onReceiveData);
			});
		});
	}

	componentWillUnmount() {
		this.state.peer.destroy();
	}

	connect = () => {
		var peerId = this.state.peerId;
		var connection = this.state.peer.connect(peerId);

		this.setState({
		    conn: connection
		}, () => {
			this.state.conn.on('open', () => {
				this.setState({
					connected: true
				});
			});
			this.state.conn.on('data', this.onReceiveData);
		});
	};

	sendFile = (event) => {
    console.log(event.target.files);
    var file = event.target.files[0];
    var blob = new Blob(event.target.files, {type: file.type});

    this.state.conn.send({
        file: blob,
        filename: file.name,
        filetype: file.type
    });
	};

	onReceiveData = (data) => {
		console.log('Received', data);
		var blob = new Blob([data.file], {type: data.filetype});
		var url = URL.createObjectURL(blob);

		this.addFile({
			'name': data.filename,
			'url': url
		});
  };

	addFile = (file) => {
		var file_name = file.name;
		var file_url = file.url;

		var files = this.state.files;
		var file_id = randomstring.generate(5);

		files.push({
			id: file_id,
			url: file_url,
			name: file_name
		});

		this.setState({
			files: files
		});
	};

	handleTextChange = (event) => {
		this.setState({
		  peerId: event.target.value
		});
	};

	render() {
		return (
			<div className="app app-container">
				{this.state.initialized ? this.renderInitialized() : this.renderNotInitialized()}
			</div>
		);
	}

	renderInitialized() {
		return (
			<div>
				<div>
					<img src={logo} className="app-logo" alt="Logo"></img>
				</div>
				<div>
					{/* TODO: how to get my id label */}
					<span>{this.props.opts.myIdLabel || 'Your PeerJS ID:'} </span>
					<strong className="mui--divider-left">{this.state.myId}</strong>
				</div>
				{this.state.connected ? this.renderConnected() : this.renderNotConnected()}
			</div>
		);
	}

	renderNotInitialized() {
		return (
			<div>Loading...</div>
		);
	}

	renderNotConnected() {
		return (
			<div>
				<hr />
				<div className="mui-textfield">
					<input type="text" className="mui-textfield" onChange={this.handleTextChange} />
					<label>{this.props.opts.peerIdLabel || 'Peer ID'}</label>
				</div>
				<button className="mui-btn mui-btn--accent" onClick={this.connect}>
					{this.props.opts.connectLabel || 'connect'}
				</button>
			</div>
		);
	}

	renderConnected() {
		return (
			<div>
				<hr />
				<div>
					<input type="file" name="file" id="file" className="mui--hide" onChange={this.sendFile} />
					<label htmlFor="file" className="mui-btn mui-btn--small mui-btn--primary mui-btn--fab">+</label>
				</div>
				<div>
					<hr />
					{this.state.files.length ? this.renderListFiles() : this.renderNoFiles()}
				</div>
			</div>
		);
	}

	renderListFiles() {
		return (
			<div id="file_list">
				<table className="mui-table mui-table--bordered">
					<thead>
					  <tr>
					    <th>{this.props.opts.file_list_label || 'Files shared to you: '}</th>
					  </tr>
					</thead>
					<tbody>
						{this.state.files.map(this.renderFile, this)}
					</tbody>
				</table>
			</div>
		);
	}

  renderNoFiles = () => {
		return (
			<span id="no_files_message">
				{this.props.opts.no_files_label || 'No files shared to you yet'}
			</span>
		);
	}

	renderFile = (file) => {
		return (
			<tr key={file.id}>
				<td>
					<a href={file.url} download={file.name}>{file.name}</a>
				</td>
			</tr>
		);
	}
}

export default App;
