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
            dbLabName: '',
            waiting: false
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

    handleScan(data) {
        if (data && !this.state.waiting) {
            this.setState({ waiting: true });
            const [id, otp, userId, scannedBy, sessionId, module] = data.split('/');
            //First check if QR code is valid, if invalid throw error
            //If QR is valid check if it is already verified or not
            //If both are true, then start processing
            if (this.check(id, otp) == true) {
                let qrData = {
                    id: id,
                }
                axios.post('/apps/QRScanner/get-items', qrData).then((response) => {
                    if (!response.data.isVerified) {
                        axios.get('/apps/QRScanner/retrieve-privilege').then((privilegeResponse) => {
                            let responseBody = JSON.parse(privilegeResponse.data.response.body);
                            let scannedUserDetails = getScannedUserDetails(responseBody, scannedBy, module);
                            if (scannedUserDetails.canScan) {
                                //Student workflow
                                var studentWorkflow = false;
                                var validTimeStudent = true;
                                if (scannedUserDetails.dbStartDate != null && scannedUserDetails.dbEndDate != null) {
                                    if (scannedUserDetails.dbStartDate == scannedUserDetails.dbEndDate) {
                                        studentWorkflow = true;
                                        let systemTime = new Date();
                                        let startDateTime = new Date(scannedUserDetails.dbStartDate.slice(0, 10) + ' ' + scannedUserDetails.dbStartTime);
                                        let endDateTime = new Date(scannedUserDetails.dbEndDate.slice(0, 10) + ' ' + scannedUserDetails.dbEndTime);
                                        if (!(systemTime >= startDateTime && systemTime <= endDateTime)
                                            || !isToday(scannedUserDetails.dbStartDate)) {
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
                                        scannedBy: scannedBy,
                                        module: module,
                                        venue: scannedUserDetails.dbLabName,
                                        startDate: scannedUserDetails.dbStartDate,
                                        endDate: scannedUserDetails.dbEndDate,
                                        startTime: scannedUserDetails.dbStartTime,
                                        endTime: scannedUserDetails.dbEndTime,
                                        passOnPrivilege: false,
                                        canScan: false
                                    };
                                    axios.post('/apps/QrScanner/update-privilege', privilegeData)
                                        .then(response => {
                                            console.log(response);
                                        })
                                        .catch((error) => {
                                            this.setState({ appSTATE: 'Error' })
                                        });
                                    axios.put('/apps/QrScanner/update-otp', otpData)
                                        .then(response => {
                                            console.log(response);
                                        })
                                        .catch((error) => {
                                            this.setState({ appSTATE: 'Error' })
                                        });
                                } else if (!studentWorkflow) {
                                    if (scannedUserDetails.passOnPrivilege) {
                                        this.setState({
                                            appSTATE: 'Result', currentID: id, currentOTP: otp,
                                            currentUserId: userId, currentScannedBy: scannedBy,
                                            currentSessionId: sessionId, currentModule: module,
                                            passOnPrivilegeOfScanningUser: scannedUserDetails.passOnPrivilege,
                                            dbStartDate: scannedUserDetails.dbStartDate, dbEndDate: scannedUserDetails.dbEndDate,
                                            dbStartTime: scannedUserDetails.dbStartTime, dbEndTime: scannedUserDetails.dbEndTime,
                                            dbLabName: scannedUserDetails.dbLabName
                                        });
                                    } else {
                                        this.setState({ appSTATE: 'CannotPassOnPrivilege' });
                                    }
                                }
                            } else {
                                this.setState({ appSTATE: 'CannotScan' });
                            }
                        });
                    } else {
                        this.setState({ appSTATE: 'QRVerified' });
                    }
                });
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
        this.setState({ appSTATE: 'Verification', waiting: false });
        this.forceUpdate();
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
        if (this.state.startDate != null && this.state.endDate != null) {
            //Head Demonstrator/ Demonstrator workflow, Checking if the date is in range
            //If DB values are not present, Lecturer can give whatever values for the date range he wants
            if (this.state.dbStartDate != null && this.state.dbEndDate != null) {
                let dbStartDateUTC = new Date(new Date(this.state.dbStartDate).getUTCMonth() + "/" + new Date(this.state.dbStartDate).getDate()
                    + "/" + new Date(this.state.dbStartDate).getUTCFullYear());
                let dbEndDateUTC = new Date(new Date(this.state.dbEndDate).getUTCMonth() + "/" + new Date(this.state.dbEndDate).getDate()
                    + "/" + new Date(this.state.dbEndDate).getUTCFullYear());
                if (new Date(this.state.startDate) >= dbStartDateUTC && new Date(this.state.endDate) <= dbEndDateUTC) {
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
                if (!(validDatesChosen && validTimeChosen && validLabChosen)) {
                    invalidDateOrTimeOrLab = true;
                    this.setState({ appSTATE: 'InvalidDateOrTimeOrLab' });
                }
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
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '50%' }} align="right">
                        <label>
                            Lab:
                        </label>
                    </div>
                    <div style={{ width: '50%', marginLeft: '10px' }}>
                        <input type="text" style={{ width: '45%' }} value={this.state.venue} onChange={this.handleVenueChange} />
                    </div>
                </div>
                <br />
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '50%' }} align="right">
                        <label>Start Date(MM/DD/YYYY):
                        </label>
                    </div>
                    <div style={{ width: '50%', marginLeft: '10px' }}>
                        <input type="text" style={{ width: '45%' }}
                            value={this.state.startDate}
                            onChange={this.handleStartDateChange}
                            name="startDate"
                        />
                    </div>
                </div>
                <br />
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '50%' }} align="right">
                        <label>End Date(MM/DD/YYYY):
                        </label>
                    </div>
                    <div style={{ width: '50%', marginLeft: '10px' }}>
                        <input type="text" style={{ width: '45%' }}
                            value={this.state.endDate}
                            onChange={this.handleEndDateChange}
                            name="endDate"
                        />
                    </div>
                </div>
                <br />
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '50%' }} align="right">
                        <label>Start Time(HH:MM):
                        </label>
                    </div>
                    <div style={{ width: '50%', marginLeft: '10px' }}>
                        <input type="text" style={{ width: '45%' }}
                            value={this.state.startTime}
                            onChange={this.handleStartTimeChange}
                            name="startTime"
                        />
                    </div>
                </div>
                <br />
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '50%' }} align="right">
                        <label>End Time(HH:MM):
                        </label>
                    </div>
                    <div style={{ width: '50%', marginLeft: '10px' }}>
                        <input type="text" style={{ width: '45%' }}
                            value={this.state.endTime}
                            onChange={this.handleEndTimeChange}
                            name="endTime"
                        />
                    </div>
                </div>
                <br />
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '50%' }} align="right">
                        <label>
                            Pass on Privilege:
                        </label>
                    </div>
                    <div style={{ width: '50%', marginLeft: '10px' }}>
                        <input type="checkbox" checked={this.state.passOnPrivilege}
                            onChange={this.handlePassOnPrivilegeChange} />
                    </div>
                </div>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '50%' }} align="right">
                        <label>
                            Can Scan:
                        </label></div>
                    <div style={{ width: '50%', marginLeft: '10px' }}>
                        <input type="checkbox" checked={this.state.canScan}
                            onChange={this.handleCanScanChange} />
                    </div>
                </div>
                <div style={{ width: '75%' }} align="right">
                    <input type="submit" value="Verify" />
                </div>
                <br />
            </form>
        } else if (appState === "StudentResult") {
            view = <div>
                <h2>Student logged in succesfully. Logged in student have access to the module resources</h2>
                <button onClick={this.handleClick}>Keep Scanning</button>
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
        } else if (appState === "QRVerified") {
            view = <div>
                <h2>QR Code is already verified</h2>
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

function getScannedUserDetails(responseBody, scannedBy, module) {
    let dbStartDate, dbEndDate, dbStartTime, dbEndTime, dbLabName = null;
    let canScan, passOnPrivilege = false;
    if (responseBody) {
        for (var i = 0; i < responseBody.length; i++) {
            if (responseBody[i].UserId === scannedBy && responseBody[i].Module == module) {
                //If End Date and Start date both null - Lecturer flow
                //If End Date > Start Date - Head Demonstrator flow
                //If End Date === Start Date - Demonstrator flow
                dbStartDate = responseBody[i].StartDate;
                dbEndDate = responseBody[i].EndDate;
                dbStartTime = responseBody[i].StartTime;
                dbEndTime = responseBody[i].EndTime;
                dbLabName = responseBody[i].RoomName;
                canScan = responseBody[i].CanScan;
                passOnPrivilege = responseBody[i].PassOnPrivilege;
                if (dbStartDate != null && dbEndDate != null) {
                    if ((dbStartDate == dbEndDate && isToday(dbStartDate))
                        || dbEndDate > dbStartDate) {
                        break;//Found Demonstrator/ Head Demonstrator record
                    }
                } else {
                    break;//Found Lecturer Record
                }
            }
        }
    }
    return {
        "dbStartDate": dbStartDate,
        "dbEndDate": dbEndDate,
        "dbStartTime": dbStartTime,
        "dbEndTime": dbEndTime,
        "dbLabName": dbLabName,
        "canScan": canScan,
        "passOnPrivilege": passOnPrivilege
    }
}