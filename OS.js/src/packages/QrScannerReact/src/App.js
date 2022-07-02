import React, { Component } from 'react';
import axios from 'axios';
import QrReader from 'react-qr-reader';

export default class App extends Component {
    constructor(props) {
        super(props);
        this.check = this.check.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleError = this.handleError.bind(this);
        this.handleScan = this.handleScan.bind(this);
        this.handleVenueChange = this.handleVenueChange.bind(this);
        this.handleModuleChange = this.handleModuleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = {
            result: 'No result',
            appSTATE: 'Verification',
            currentID: null,
            currentOTP: null,
            venue: '',
            module: '',
        }
    }

    check(id, otp) {
        const regular = new RegExp('^[a-zA-Z0-9][a-zA-Z0-9]*[a-zA-Z0-9]$');
        if (id.length == 24 && otp.length == 12 && regular.test(id) && regular.test(otp)) return true;
        return false;
    }

    handleError = err => {
        this.setState({ appState: 'Error' });
    }

    handleScan = data => {
        if (data) {
            const [id, otp] = data.split('/');
            if (this.check(id, otp) == true) {
                this.setState({ appSTATE: 'Result', currentID: id, currentOTP: otp });
            }

            else {
                this.setState({ appSTATE: 'Error' });
            }
        }
    }

    handleVenueChange(event) {
        this.setState({ venue: event.target.value });
    }

    handleModuleChange(event) {
        this.setState({ module: event.target.value });
    }

    handleClick() {
        this.setState({ appSTATE: 'Verification' });
    }

    handleSubmit(event) {
        event.preventDefault();
        const data =
        {
            module: this.state.module,
            venue: this.state.venue,
            otp: this.state.currentOTP,
            id: this.state.currentID,
        };

        axios.put('/apps/QrScannerReact/update-otp', data)
            .then(response => {
                console.log(response);
                this.setState({ appSTATE: 'Verification' });
            })
            .catch((error) => {
                this.setState({ appSTATE: 'Error' })
            })
    }

    render() {
        const appState = this.state.appSTATE;
        let view;

        if (appState === "Verification") {
            view = <QrReader
                constraints={{ facingMode: { exact: 'environment' } }}
                delay={0}
                onError={this.handleError}
                onScan={this.handleScan}
                style={{ width: '100%' }}
            />
        }

        else if (appState === "Result") {

            view = <form onSubmit={this.handleSubmit}>
                <label>
                    What room are you in?
                    <input type="text" value={this.state.venue} onChange={this.handleVenueChange} />
                </label>
                <br />
                <label>
                    What module is going on in this room?
                    <input type="text" value={this.state.module} onChange={this.handleModuleChange} />
                </label>
                <br />
                <input type="submit" value="Verify now!!" />
                <br />
            </form>
        }

        else {
            view = <div>
                <h2>An error occured during scanning</h2>
                <p>Most likely cause of errors</p>
                <ul>
                    <li>Scanning the wrong QR code</li>
                    <li>The QR code value has been changed from what was generated</li>
                    <li>Network error</li>
                </ul>
                <button onClick={this.handleClick}>Keep Scanning</button>
            </div>
        }

        return (
            <div>
                {view}
            </div>
        );
    }
}