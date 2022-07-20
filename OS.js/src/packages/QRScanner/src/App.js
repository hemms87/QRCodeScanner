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
            currentUserId: null,
            currentScannedBy: null,
            currentSessionId: null,
            currentModule: null,
            passOnPrivilegeOfScanningUser: false,
            startDate: '',
            endDate: '',
            startTime: '',
            endTime: '',
            passOnPrivilege: false,
            canScan: false,
            venue: '',
            dbStartDate: '',
            dbEndDate: '',
            dbStartTime: '',
            dbEndTime: '',
            dbLabName: ''
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

    async handleScan(data) {
        if (data) {
            const [id, otp, userId, scannedBy, sessionId, module] = data.split('/');
            let dbStartDate, dbEndDate, dbStartTime, dbEndTime, dbLabName;
            var canScan = false;
            var passOnPrivilege = false;
            let privilegeResponse = await axios.get('/apps/QRScanner/retrieve-privilege');
            let responseBody = JSON.parse(privilegeResponse.data.response.body);
            if (responseBody) {
                for (var i = 0; i < responseBody.length; i++) {
                    if (responseBody[i].UserId === scannedBy && responseBody[i].Module == module) {
                        if (responseBody[i].StartDate != null) {
                            dbStartDate = responseBody[i].StartDate;
                        }
                        if (responseBody[i].EndDate != null) {
                            dbEndDate = responseBody[i].EndDate;
                        }
                        if (responseBody[i].StartTime != null) {
                            dbStartTime = responseBody[i].StartTime;
                        }
                        if (responseBody[i].EndTime != null) {
                            dbEndTime = responseBody[i].EndTime;
                        }
                        if (responseBody[i].RoomName != null) {
                            dbLabName = responseBody[i].RoomName;
                        }
                        if (responseBody[i].CanScan) {
                            canScan = true;
                            passOnPrivilege = responseBody[i].PassOnPrivilege;
                            break;
                        }
                    }
                }
            }
            if (this.check(id, otp) == true && canScan) {
                //Student workflow
                var studentWorkflow = false;
                var validTimeStudent = true;
                if (dbStartDate != null && dbEndDate != null) {
                    if (dbStartDate == dbEndDate) {
                        studentWorkflow = true;
                        let systemTime = new Date();
                        let startDateTime = new Date(dbStartDate.slice(0, 10) + ' ' + dbStartTime);
                        let endDateTime = new Date(dbEndDate.slice(0, 10) + ' ' + dbEndTime);
                        if (!(systemTime >= startDateTime && systemTime <= endDateTime)
                            || !isToday(dbStartDate)) {
                            validTimeStudent = false;
                            this.setState({ appSTATE: 'StudentError' });
                        }
                    }
                }
                if (studentWorkflow && validTimeStudent) {
                    this.setState({ appSTATE: 'StudentResult' });
                    const otpData = {
                        userId: userId,
                        sessionId: sessionId,
                        scannedBy: scannedBy,
                        otp: otp,
                        id: id,
                    };

                    const privilegeData = {
                        userId: userId,
                        scannedBy: sessionId,
                        module: module,
                        venue: dbLabName,
                        startDate: dbStartDate,
                        endDate: dbEndDate,
                        startTime: dbStartTime,
                        endTime: dbEndTime,
                        passOnPrivilege: false,
                        canScan: false
                    };
                    axios.put('/apps/QrScanner/update-otp', otpData)
                        .then(response => {
                            console.log(response);
                            this.setState({ appSTATE: 'Verification' });
                        })
                        .catch((error) => {
                            this.setState({ appSTATE: 'Error' })
                        });

                    axios.post('/apps/QrScanner/update-privilege', privilegeData)
                        .then(response => {
                            console.log(response);
                        })
                        .catch((error) => {
                            this.setState({ appSTATE: 'Error' })
                        });
                } else if (!studentWorkflow) {
                    this.setState({
                        appSTATE: 'Result', currentID: id, currentOTP: otp,
                        currentUserId: userId, currentScannedBy: scannedBy,
                        currentSessionId: sessionId, currentModule: module,
                        passOnPrivilegeOfScanningUser: passOnPrivilege,
                        dbStartDate: dbStartDate, dbEndDate: dbEndDate,
                        dbStartTime: dbStartTime, dbEndTime: dbEndTime,
                        dbLabName: dbLabName
                    });
                }
            } else if (this.check(id, otp) == true && !canScan) {
                this.setState({ appSTATE: 'CannotScan' });
            } else {
                this.setState({ appSTATE: 'Error' });
            }
        }
    }

    handleVenueChange(event) {
        this.setState({ venue: event.target.value });
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
        this.setState({ passOnPrivilege: !this.state.passOnPrivilege });
    }

    handleCanScanChange(event) {
        this.setState({ canScan: !this.state.canScan });
    }

    handleClick() {
        this.setState({ appSTATE: 'Verification' });
    }

    handleSubmit(event) {
        event.preventDefault();
        const otpData = {
            userId: this.state.currentUserId,
            sessionId: this.state.currentSessionId,
            scannedBy: this.state.currentScannedBy,
            otp: this.state.currentOTP,
            id: this.state.currentID,
        };

        const privilegeData = {
            userId: this.state.currentUserId,
            scannedBy: this.state.currentScannedBy,
            module: this.state.currentModule,
            venue: this.state.venue,
            startDate: this.state.startDate,
            endDate: this.state.endDate,
            startTime: this.state.startTime,
            endTime: this.state.endTime,
            passOnPrivilege: this.state.passOnPrivilege,
            canScan: this.state.canScan
        };
        var validDatesChosen = false;
        var validTimeChosen = false;
        var validLabChosen = false;
        var invalidDateOrTimeOrLab = false;
        if (this.state.startDate == this.state.endDate) {
            //Demonstrator workflow
            if (this.state.dbStartDate != null && this.state.dbEndDate != null) {
                if ((new Date(this.state.startDate) >= new Date(this.state.dbStartDate.slice(0, 10))
                    && new Date(this.state.endDate) <= new Date(this.state.dbEndDate.slice(0, 10)))) {
                    validDatesChosen = true;
                }
                if (this.state.dbStartTime != null && this.state.dbEndTime != null) {
                    if (this.state.dbStartTime == this.state.startTime &&
                        this.state.dbEndTime == this.state.endTime) {
                        validTimeChosen = true;
                    }
                }
                if (this.state.venue == this.state.dbLabName) {
                    validLabChosen = true;
                }
            }
            if (!(validDatesChosen && validTimeChosen && validLabChosen)) {
                invalidDateOrTimeOrLab = true;
                this.setState({ appSTATE: 'InvalidDateOrTimeOrLab' });
            }
        }
        if (!invalidDateOrTimeOrLab) {
            if ((this.state.passOnPrivilege && this.state.passOnPrivilegeOfScanningUser)
                || !this.state.passOnPrivilege) {
                axios.put('/apps/QrScanner/update-otp', otpData)
                    .then(response => {
                        console.log(response);
                        this.setState({ appSTATE: 'Verification' });
                    })
                    .catch((error) => {
                        this.setState({ appSTATE: 'Error' })
                    });

                axios.post('/apps/QrScanner/update-privilege', privilegeData)
                    .then(response => {
                        console.log(response);
                    })
                    .catch((error) => {
                        this.setState({ appSTATE: 'Error' })
                    });
            } else {
                this.setState({ appSTATE: 'CannotPassOnPrivilege' });
            }
        }
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
                    Lab:
                    <input type="text" value={this.state.venue} onChange={this.handleVenueChange} />
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
                    <input type="checkbox" checked={this.state.passOnPrivilege}
                        onChange={this.handlePassOnPrivilegeChange} />
                </label>
                <label>
                    Can Scan:
                    <input type="checkbox" checked={this.state.canScan}
                        onChange={this.handleCanScanChange} />
                </label>
                <input type="submit" value="Verify" />
                <br />
            </form>
        } else if (appState === "StudentResult") {
            view = <div>
                <h2>Student logged in succesfully. Logged in student have access to the module resources</h2>
            </div>
        } else if (appState === "CannotScan") {
            view = <div>
                <h2>An error occured during scanning</h2>
                <p>Most likely cause of errors</p>
                <ul>
                    <li>Module Code did not match to the user who is trying to scan</li>
                    <li>This user does not have privileges to Scan the QR Code</li>
                </ul>
                <button onClick={this.handleClick}>Keep Scanning</button>
            </div>
        } else if (appState === "CannotPassOnPrivilege") {
            view = <div>
                <h2>An error occured during scanning</h2>
                <p>Most likely cause of errors</p>
                <ul>
                    <li>No permissions to Pass on Privileges for the Scanning User</li>
                </ul>
                <button onClick={this.handleClick}>Keep Scanning</button>
            </div>
        } else if (appState === "InvalidDateOrTimeOrLab") {
            view = <div>
                <h2>An error occured during scanning</h2>
                <p>Most likely cause of errors</p>
                <ul>
                    <li>Date does not fall in Start and End Date range of Head Demonstrator</li>
                    <li>Start and End Time does not match with Head Demonstrator's</li>
                    <li>Lab name does not match with Head Demonstrator's Lab Name</li>
                </ul>
                <button onClick={this.handleClick}>Keep Scanning</button>
            </div>
        } else if (appState === "StudentError") {
            view = <div>
                <h2>An error occured during scanning</h2>
                <p>Most likely cause of errors</p>
                <ul>
                    <li>Lab Time expired, or trying to scan early before the lab commences</li>
                </ul>
                <button onClick={this.handleClick}>Keep Scanning</button>
            </div>
        } else {
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

function isToday(someDate) {
    const today = new Date()
    return new Date(someDate).getDate() == today.getDate() &&
        new Date(someDate).getMonth() == today.getMonth() &&
        new Date(someDate).getFullYear() == today.getFullYear();
}