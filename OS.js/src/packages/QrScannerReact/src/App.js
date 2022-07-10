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
        this.handleScannedByChange = this.handleScannedByChange.bind(this);
        this.handleVenueChange = this.handleVenueChange.bind(this);
        this.handleModuleChange = this.handleModuleChange.bind(this);
        this.handleStartDateChange = this.handleStartDateChange.bind(this);
        this.handleEndDateChange = this.handleEndDateChange.bind(this);
        this.handleStartTimeChange = this.handleStartTimeChange.bind(this);
        this.handleEndTimeChange = this.handleEndTimeChange.bind(this);
        this.handlePassOnPrivilegeChange = this.handlePassOnPrivilegeChange.bind(this);
        this.handleCanScanChange = this.handleCanScanChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = {
            result: 'No result',
            appSTATE: 'Verification',
            currentID: null,
            currentOTP: null,
            scannedBy: '',
            startDate: '',
            endDate: '',
            startTime: '',
            endTime: '',
            passOnPrivilege: false,
            canScan: false,
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

    handleScannedByChange(event) {
        this.setState({ scannedBy: event.target.value });
    }

    handleVenueChange(event) {
        this.setState({ venue: event.target.value });
    }

    handleModuleChange(event) {
        this.setState({ module: event.target.value });
    }

    handleStartDateChange(event) {
        this.setState({ startDate: event.target.value });
    }

    handleEndDateChange(event) {
        this.setState({ endDate: event.target.value });
    }

    handleStartTimeChange(event) {
        this.setState({ startTime: event.target.value });
    }

    handleEndTimeChange(event) {
        this.setState({ endTime: event.target.value });
    }

    handlePassOnPrivilegeChange(event) {
        this.setState({ passOnPrivilege: event.target.value });
    }

    handleCanScanChange(event) {
        this.setState({ canScan: event.target.value });
    }

    handleClick() {
        this.setState({ appSTATE: 'Verification' });
    }

    handleSubmit(event) {
        event.preventDefault();
        const data =
        {
            scannedBy: this.state.scannedBy,
            module: this.state.module,
            venue: this.state.venue,
            startDate: this.state.startDate,
            endDate: this.state.endDate,
            startTime: this.state.startTime,
            endTime: this.state.endTime,
            passOnPrivilege: this.state.passOnPrivilege,
            canScan: this.state.canScan,
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
                    Scanned By:
                    <input type="text" value={this.state.scannedBy} onChange={this.handleScannedByChange} />
                </label>
                <br />
                <label>
                    Lab:
                    <input type="text" value={this.state.venue} onChange={this.handleVenueChange} />
                </label>
                <br />
                <label>
                    Module Code:
                    <input type="text" value={this.state.module} onChange={this.handleModuleChange} />
                </label>
                <br />
                <label>Start Date(MM/DD/YYYY):
                    <input type="text"
                        value={this.state.startDate}
                        onChange={this.handleStartDateChange}
                        name="startDate"
                    />
                </label>
                <br />
                <label>End Date(MM/DD/YYYY):
                    <input type="text"
                        value={this.state.endDate}
                        onChange={this.handleEndDateChange}
                        name="endDate"
                    />
                </label>
                <br />
                <label>Session Start Time(HH:MM):
                    <input type="text"
                        value={this.state.startTime}
                        onChange={this.handleStartTimeChange}
                        name="startTime"
                    />
                </label>
                <br />
                <label>Session End Time(HH:MM):
                    <input type="text"
                        value={this.state.endTime}
                        onChange={this.handleEndTimeChange}
                        name="endTime"
                    />
                </label>
                <br />
                <label>
                    Pass on Privilege:
                    <input type="checkbox" value={this.state.passOnPrivilege} onChange={this.handlePassOnPrivilegeChange} />
                </label>
                <label>
                    Can Scan:
                    <input type="checkbox" value={this.state.canScan} onChange={this.handleCanScanChange} />
                </label>
                <input type="submit" value="Verify" />
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