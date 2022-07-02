import React, { Component } from 'react';
import QRCode from 'react-qr-code';
import axios from 'axios';

class App extends Component{
  constructor(props){
    super(props);
    this.createotp = this.createotp.bind(this);
    this.state = {
      current_url : '',
      current_id : '',
      isClicked : false,
      is_verified: '',
    }
  }

  async createotp(){
    let response = await axios.post('/apps/Test_Application/create-otp')
    console.log(response);
    const stats = (response.data.isVerified === 'true');
    const qr_url = response.data.id + '/' + response.data.otp; 
    this.setState({isClicked: true, current_id: response.data.id, is_verified: stats, current_url: qr_url});
    console.log(this.state);
  }

  render(){
    let btnClicked = this.state.isClicked;
    let view;

    if(btnClicked)
    {
      view = <QrcodeView url = {this.state.current_url} isVerified = {this.state.is_verified} id = {this.state.current_id}/>;
    }

    else
    {
      view = <button onClick={this.createotp}>Get QRCode</button>
    }

    return(
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
  constructor(props){
    super(props);
    this.getItems = this.getItems.bind(this);
    this.state = {
      url : props.url,
      id: props.id,
      isVerified: props.isVerified,
    };
  }

  async getItems(){
    let data = {
      id : this.state.id,
    }
    let response = await axios.post('/apps/Test_Application/get-items', data);
    console.log('Response ', response.data);
    const stats = response.data.isVerified;
    console.log('Stats ', stats);
    this.setState({isVerified : stats});
  }

  render(){
    let view;
      if(this.state.isVerified){
        view = <SuccessPage />
      }

    else{
      view =  
        <div>
          <QRCode size={200} value={this.state.url}/> 
          <br/>
          <button onClick={this.getItems}>Verifiy me!</button>
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