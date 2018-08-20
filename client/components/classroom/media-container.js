import React, { Component } from 'react';
import Whiteboard from './whiteboard-container';
import Editor from './editor-container';
import { FeedbackForm } from '../../components';
import clientSocket from '../../socket';


class MediaContainer extends Component {
  state = {
    user: '',
    bridge: '',
    whiteboard: '',
    editor: '',
    feedback: ''
  };

  // localVideo = document.getElementById('#local-video');
  // remoteVideo = document.getElementById('#remote-video');

  componentWillMount() {
    // chrome polyfill for connection between local device and remote peer
    window.RTCPeerConnection =
      window.RTCPeerConnection || window.webkitRTCPeerConnection;
    // set `media` to be the MediaContainer component
    this.props.media(this);
  }

  componentDidMount() {
    this.props.getUserMedia.then(
      stream => (this.localVideo.srcObject = this.localStream = stream)
    );

    // clientSocket.on('message', this.onMessage);
    // clientSocket.on('hangup', this.onRemoteHangup);
  }

  componentWillUnmount() {
    this.props.media(null);
    if (this.localStream !== undefined) {
      this.localStream.getVideoTracks()[0].stop();
    }
    this.props.mediaEvents.emit('leave');
  }

  onRemoteHangup = () => {
    this.setState({
      user: 'host',
      bridge: 'host-hangup'
    });
  };

  onMessage = msg => {
    if (msg.type === 'offer') {
      // set remote description and answer
      this.pc.setRemoteDescription(new RTCSessionDescription(msg));
      this.pc
        .createAnswer()
        .then(this.setDescription)
        .then(this.sendDescription)
        .catch(this.handleError); // handle the failure to connect
    } else if (msg.type === 'answer') {
      // set remote description
      this.pc.setRemoteDescription(new RTCSessionDescription(msg));
    } else if (msg.type === 'candidate') {
      // add ice candidate
      this.pc.addIceCandidate(
        new RTCIceCandidate({
          sdpMLineIndex: msg.mlineindex,
          candidate: msg.candidate
        })
      );
    }
  };

  sendData = msg => this.dc.send(JSON.stringify(msg));

  // Set up the data channel message handler
  setupDataHandlers = () => {
    this.dc.onmessage = err => {
      const msg = JSON.parse(err.data);
      console.log('received message over data channel:' + msg);
    };
    this.dc.onclose = () => {
      this.remoteStream.getVideoTracks()[0].stop();
      console.log('The Data Channel is Closed');
    };
  };

  setDescription = offer => this.pc.setLocalDescription(offer);

  // send the offer to a server to be forwarded to the other peer
  sendDescription = () => this.props.mediaEvents.send(this.pc.localDescription);

  hangup = () => {
    if (!this.pc) return;
    this.setState({ feedback: 'has-feedback-form' });
    this.setState({ user: 'guest', bridge: 'guest-hangup' });
    this.pc.close();
    this.props.mediaEvents.emit('leave');
  };

  handleError = err => console.log('error!', err);

  closeEditor = () => {
    this.setState({ editor: '' });
  };

  closeWhiteboard = () => {
    this.setState({ whiteboard: '' });
  };

  notifyClientRoomIsFull = () => {
    this.setState({ bridge: 'full' });
  };

  //
  // HEY!
  // RENAME THIS TO BE MORE CLEAR!
  // ==================================================
  hideAuth = () => {};

  startCall = event => {
    event.preventDefault();
    this.setState({ bridge: 'connecting' });
    this.props.mediaEvents.emit('rtc-auth', this.state);
  }

  init = () => {
    // wait for local media to be ready
    const attachMediaIfReady = () => {
      this.dc = this.pc.createDataChannel('chat');
      this.setupDataHandlers();
      console.log('attachMediaIfReady');
      this.pc
        .createOffer()
        .then(this.setDescription)
        .then(this.sendDescription)
        .catch(this.handleError); // handle the failure to connect
    };
    // set up the peer connection
    // this is one of Google's public STUN servers
    // make sure the offer/answer role does not change. If user A does a SLD
    // with type=offer initially, it must do that during the whole session
    this.pc = new RTCPeerConnection({
      iceServers: [{ url: 'stun:stun.l.google.com:19302' }]
    });
    // when our browser gets a candidate, send it to the peer
    this.pc.onicecandidate = event => {
      if (event.candidate) {
        this.props.mediaEvents.send({
          type: 'candidate',
          mlineindex: event.candidate.sdpMLineIndex,
          candidate: event.candidate.candidate
        });
      }
    };
    // when the other side added a media stream, show it on screen
    this.pc.onaddstream = event => {
      this.remoteStream = event.stream;
      this.remoteVideo.srcObject = this.remoteStream = event.stream;
      this.setState({ bridge: 'established' });
    };
    this.pc.ondatachannel = event => {
      // data channel
      this.dc = event.channel;
      this.setupDataHandlers();
      this.sendData({
        peerMediaStream: {
          video: this.localStream.getVideoTracks()[0].enabled
        }
      });
    };
    // attach local media to the peer connection
    this.localStream
      .getTracks()
      .forEach(track => this.pc.addTrack(track, this.localStream));
    // call if we were the last to connect (to increase
    // chances that everything is set up properly at both ends)
    if (this.state.user === 'host') {
      this.props.getUserMedia.then(attachMediaIfReady);
    }
  };








  render() {

    clientSocket.on('bridge', role => this.props.media.init());

    clientSocket.on('create-room--from-server', room => {
      console.log('**** THE SERVER SAID TO CREATE ROOM:', room);
      this.setState({ user: 'host', bridge: 'create' })
    });

    clientSocket.on('join-room--from-server', room => {
      console.log('**** SERVER WANTS US TO JOIN ROOM:', room);
      this.setState({ user: 'guest', bridge: 'join' });
    });

    clientSocket.on('room-is-full--from-server', this.notifyClientRoomIsFull);





    const { bridge, whiteboard, editor, feedback } = this.state;
    return (
      <div
        className={`classroom-media ${bridge} ${whiteboard} ${editor} ${feedback}`}
      >
        <div className="video is-remote">
          <video
            id="#remote-video"
            ref={ref => (this.remoteVideo = ref)}
            autoPlay
          />
        </div>
        <div className="video is-local">
          <video
            id="#local-video"
            ref={ref => (this.localVideo = ref)}
            autoPlay
            muted
            draggable
          />
        </div>
        <Whiteboard
          closeWhiteboard={this.closeWhiteboard}
          socket={this.props.mediaEvents}
        />
        <Editor closeEditor={this.closeEditor} socket={this.props.mediaEvents} />
        <FeedbackForm />
      </div>
    );
  }
}

export default MediaContainer;
