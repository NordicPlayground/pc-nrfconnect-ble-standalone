/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

'use strict';

import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { connect } from 'react-redux';
import { OrderedMap } from 'immutable';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';

import * as AdapterActions from '../actions/adapterActions';
import * as DiscoveryActions from '../actions/discoveryActions';
import DiscoveredDevice from '../components/DiscoveredDevice';
import DiscoveryButton from '../components/DiscoveryButton';
import TextInput from '../components/input/TextInput';
import Spinner from '../components/Spinner';
import { DiscoveryOptions } from '../reducers/discoveryReducer';
import withHotkey from '../utils/withHotkey';

const matchesFilter = filterRegexp => device => {
    if (device.name.search(filterRegexp) >= 0) return true;
    if (device.address.search(filterRegexp) >= 0) return true;
    return false;
};

class DiscoveredDevices extends React.PureComponent {
    constructor(props) {
        super(props);

        const { toggleScan, clearDevicesList } = this.props;
        window.addEventListener('core:toggle-scan', toggleScan);
        window.addEventListener('core:clear-scan', clearDevicesList);

        this.handleFilterChange = this.handleFilterChange.bind(this);
        this.handleSortByRssiCheckedChange = this.handleCheckedChange.bind(
            this,
            'sortByRssi'
        );
        this.handleActiveScanCheck = this.handleActiveScanCheck.bind(this);
    }

    componentDidMount() {
        const { bindHotkey, clearDevicesList } = this.props;
        if (clearDevicesList) {
            bindHotkey('alt+c', clearDevicesList);
        }
    }

    handleCheckedChange(property, e) {
        const { setDiscoveryOptions } = this.props;
        this.discoveryOptions[property] = e.target.checked;
        setDiscoveryOptions(this.discoveryOptions);
    }

    handleFilterChange(e) {
        const { setDiscoveryOptions } = this.props;
        this.discoveryOptions.filterString = e.target.value;
        setDiscoveryOptions(this.discoveryOptions);
    }

    handleOptionsExpanded() {
        const { toggleOptionsExpanded } = this.props;
        toggleOptionsExpanded();
    }

    handleTimeoutChange(value) {
        const { setTimeoutChange } = this.props;
        if (value < 0) {
            setTimeoutChange(0);
            return;
        }
        setTimeoutChange(value);
    }

    handleActiveScanCheck() {
        const { changeActiveScan } = this.props;
        changeActiveScan();
    }

    render() {
        const {
            discoveredDevices,
            discoveryOptions,
            isScanning,
            adapterIsConnecting,
            isAdapterAvailable,
            clearDevicesList,
            toggleScan,
            connectToDevice,
            cancelConnect,
            toggleExpanded,
            toggleOptionsExpanded,
        } = this.props;

        this.discoveryOptions = discoveryOptions.toJS();

        const dirIcon = discoveryOptions.expanded ? 'menu-down' : 'menu-right';

        const discoveryOptionsDiv = discoveryOptions.expanded ? (
            <div className="discovery-options">
                <Form.Group controlId="sortCheck">
                    <Form.Check
                        className="adv-label"
                        defaultChecked={discoveryOptions.sortByRssi}
                        onChange={this.handleSortByRssiCheckedChange}
                        label="Sort by signal strength"
                    />
                </Form.Group>
                <TextInput
                    inline
                    title="Filter list by device name or address"
                    label="Filter:"
                    className="adv-value"
                    value={this.discoveryOptions.filterString}
                    onChange={this.handleFilterChange}
                    labelClassName=""
                    wrapperClassName=""
                    placeholder="Device name or address"
                />
                <Form.Group controlId="activeScanCheck">
                    <Form.Check
                        className="adv-label"
                        defaultChecked={discoveryOptions.activeScan}
                        onChange={this.handleActiveScanCheck}
                        label="Active scan"
                    />
                </Form.Group>
                <TextInput
                    type="number"
                    inline
                    title="Timeout on scanning process (sec)"
                    label="Timeout:"
                    className="adv-timeout"
                    value={discoveryOptions.scanTimeout}
                    labelClassName=""
                    wrapperClassName=""
                    onChange={event =>
                        this.handleTimeoutChange(event.target.value)
                    }
                />
            </div>
        ) : null;

        let discoveredDeviceList = discoveredDevices.valueSeq();

        const { filterRegexp } = discoveryOptions;
        if (filterRegexp) {
            discoveredDeviceList = discoveredDeviceList.filter(
                matchesFilter(filterRegexp)
            );
        }

        return (
            <div id="discoveredDevicesContainer">
                <div>
                    <h4>
                        Discovered devices
                        <Spinner visible={isScanning} />
                    </h4>
                </div>

                <div className="padded-row">
                    <DiscoveryButton
                        scanInProgress={isScanning}
                        adapterIsConnecting={adapterIsConnecting}
                        isAdapterAvailable={isAdapterAvailable}
                        onScanClicked={toggleScan}
                    />
                    <Button
                        title="Clear list (Alt+C)"
                        onClick={clearDevicesList}
                        type="button"
                        className="btn btn-primary btn-nordic"
                    >
                        <span className="mdi mdi-trash-can" />
                        <span>Clear</span>
                    </Button>
                    <div className="discovery-options-expand">
                        <span
                            onClick={toggleOptionsExpanded}
                            onKeyDown={() => {}}
                            role="button"
                            tabIndex={0}
                        >
                            <i className={`mdi mdi-${dirIcon}`} />
                            Options
                        </span>
                        {discoveryOptionsDiv}
                    </div>
                </div>

                <div style={{ paddingTop: '0px' }}>
                    {discoveredDeviceList.map((device, address) => {
                        const key = `${address}`;
                        return (
                            <DiscoveredDevice
                                key={key}
                                device={device}
                                standalone={false}
                                adapterIsConnecting={adapterIsConnecting}
                                isConnecting={device.isConnecting}
                                onConnect={connectToDevice}
                                onCancelConnect={cancelConnect}
                                onToggleExpanded={toggleExpanded}
                            />
                        );
                    })}
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    const { discovery, adapter } = state.app;

    const { selectedAdapter } = adapter;
    let adapterIsConnecting = false;
    let scanning = false;
    let adapterAvailable = false;

    if (selectedAdapter && selectedAdapter.state) {
        adapterIsConnecting = selectedAdapter.state.connecting || false;
        scanning = selectedAdapter.state.scanning || false;
        adapterAvailable = selectedAdapter.state.available || false;
    }

    return {
        discoveredDevices: discovery.devices,
        discoveryOptions: discovery.options,
        adapterIsConnecting,
        isScanning: scanning,
        isAdapterAvailable: adapterAvailable,
    };
}

function mapDispatchToProps(dispatch) {
    const retval = {
        ...bindActionCreators(DiscoveryActions, dispatch),
        ...bindActionCreators(AdapterActions, dispatch),
    };

    return retval;
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withHotkey(DiscoveredDevices));

DiscoveredDevices.propTypes = {
    discoveredDevices: PropTypes.instanceOf(OrderedMap),
    isAdapterAvailable: PropTypes.bool,
    isScanning: PropTypes.bool,
    adapterIsConnecting: PropTypes.bool,
    clearDevicesList: PropTypes.func.isRequired,
    toggleScan: PropTypes.func.isRequired,
    connectToDevice: PropTypes.func.isRequired,
    cancelConnect: PropTypes.func.isRequired,
    bindHotkey: PropTypes.func.isRequired,
    setDiscoveryOptions: PropTypes.func.isRequired,
    toggleOptionsExpanded: PropTypes.func.isRequired,
    toggleExpanded: PropTypes.func.isRequired,
    changeActiveScan: PropTypes.func.isRequired,
    setTimeoutChange: PropTypes.func.isRequired,
    discoveryOptions: PropTypes.objectOf(DiscoveryOptions),
};

DiscoveredDevices.defaultProps = {
    discoveryOptions: { expanded: true },
    discoveredDevices: [],
    isAdapterAvailable: true,
    isScanning: false,
    adapterIsConnecting: false,
};
