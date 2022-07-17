import React, { Component } from 'react';
import QRCode from 'react-qr-code';
import axios from 'axios';

class App extends Component {
  constructor(props) {
    super(props);
    this.createotp = this.createotp.bind(this);
    this.handleUserIdChange = this.handleUserIdChange.bind(this);
    this.handleScannedByChange = this.handleScannedByChange.bind(this);
    this.state = {
      current_url: '',
      current_id: '',
      isClicked: false,
      is_verified: '',
      userId: '',
      scannedBy: '',
      sessionId: '',
    }
  }

  handleUserIdChange(event) {
    this.setState({ userId: event.target.value });
  }

  handleScannedByChange(event) {
    this.setState({ scannedBy: event.target.value });
  }

  async createotp() {
    var sessionId = '_' + Math.random().toString(36).substring(2, 9);
    var userId = this.state.userId;
    var scannedBy = this.state.scannedBy;
    let response = await axios.post('/apps/QRCodeGenerator/create-otp', { userId, sessionId });
    console.log(response);
    const stats = (response.data.isVerified === 'true');
    const qr_url = response.data.id + '/' + response.data.otp + '/' + scannedBy + '/' + response.data.sessionId;
    this.setState({
      isClicked: true, current_id: response.data.id, is_verified: stats, current_url: qr_url,
      sessionId: response.data.sessionId, userId: userId, scannedBy: scannedBy
    });
    console.log(this.state);
  }

  render() {
    let btnClicked = this.state.isClicked;
    let view;

    if (btnClicked) {
      view = <QrcodeView url={this.state.current_url} isVerified={this.state.is_verified} id={this.state.current_id}
        userId={this.state.userId} sessionId={this.state.sessionId} scannedBy={this.state.scannedBy} />;
    }

    else {
      view = <div><label>
        User ID:
        <input type="text" value={this.state.userId} onChange={this.handleUserIdChange} />
      </label>
        <br />
        <label>
          Scanned By:
          <input type="text" value={this.state.scannedBy} onChange={this.handleScannedByChange} />
        </label>
        <br />
        <button onClick={this.createotp}>Get QRCode</button>
      </div>
    }

    return (
      <div>
        {view}
      </div>
    );
  }
}

function SuccessPage(props) {
  return <h1>Your Qr code has been verified.</h1>
}

class QrcodeView extends Component {
  constructor(props) {
    super(props);
    this.getItems = this.getItems.bind(this);
    this.state = {
      url: props.url,
      id: props.id,
      isVerified: props.isVerified,
      userId: props.userId,
      sessionId: props.sessionId
    };
  }

  async getItems() {
    let data = {
      id: this.state.id,
    }
    let response = await axios.post('/apps/QRCodeGenerator/get-items', data);
    console.log('Response ', response.data);
    const stats = response.data.isVerified;
    console.log('Stats ', stats);
    this.setState({ isVerified: stats });
  }

  render() {
    let view;
    if (this.state.isVerified) {
      view = <SuccessPage />
    }

    else {
      view =
        <div>
          <QRCode size={200} value={this.state.url} />
          <br />
          <button onClick={this.getItems}>Verify me!</button>
        </div>;
    }
    return (
      <div>
        {view}
      </div>
    );

  }
}

export default App;