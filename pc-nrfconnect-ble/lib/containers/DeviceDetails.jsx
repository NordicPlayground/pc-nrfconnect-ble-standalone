/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint react/forbid-prop-types: off */

'use strict';

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';

import * as AdapterActions from '../actions/adapterActions';
import * as AdvertisingActions from '../actions/advertisingActions';
import * as BLEEventActions from '../actions/bleEventActions';
import * as DeviceDetailsActions from '../actions/deviceDetailsActions';
import * as DfuActions from '../actions/dfuActions';
import * as SecurityActions from '../actions/securityActions';
import {
    findSelectedItem,
    traverseItems,
} from '../common/treeViewKeyNavigation';
import DeviceDetailsView from '../components/DeviceDetails';
import { getInstanceIds } from '../utils/api';
import withHotkey from '../utils/withHotkey';
import DfuDialog from './DfuDialog';

class DeviceDetailsContainer extends React.PureComponent {
    constructor(props) {
        super(props);
        this.moveUp = () => this.selectNextComponent(true);
        this.moveDown = () => this.selectNextComponent(false);
        this.moveRight = () => this.expandComponent(true);
        this.moveLeft = () => this.expandComponent(false);
    }

    componentDidMount() {
        const { bindHotkey } = this.props;
        bindHotkey('up', this.moveUp);
        bindHotkey('down', this.moveDown);
        bindHotkey('left', this.moveLeft);
        bindHotkey('right', this.moveRight);
    }

    selectNextComponent(backward) {
        const { deviceDetails, selectedComponent, selectComponent } =
            this.props;
        let foundCurrent = false;

        // eslint-disable-next-line no-restricted-syntax
        for (const item of traverseItems(deviceDetails, true, backward)) {
            if (selectedComponent === null) {
                if (item !== null) {
                    selectComponent(item.instanceId);
                    return;
                }
            }

            if (item.instanceId === selectedComponent) {
                foundCurrent = true;
            } else if (foundCurrent) {
                selectComponent(item.instanceId);
                return;
            }
        }
    }

    expandComponent(expand) {
        const {
            deviceDetails,
            selectedComponent,
            setAttributeExpanded,
            selectComponent,
        } = this.props;

        if (!selectedComponent) {
            return;
        }

        const itemInstanceIds = getInstanceIds(selectedComponent);
        if (expand && itemInstanceIds.descriptor) {
            return;
        }

        const item = findSelectedItem(deviceDetails, selectedComponent);

        if (item) {
            if (expand && item.children && !item.children.size) {
                return;
            }

            if (expand && item.expanded && item.children.size) {
                this.selectNextComponent(false);
                return;
            }

            if (!expand && !item.expanded) {
                if (itemInstanceIds.characteristic) {
                    selectComponent(
                        selectedComponent.split('.').slice(0, -1).join('.')
                    );
                }

                return;
            }

            setAttributeExpanded(item, expand);
        }
    }

    render() {
        const {
            adapterState,
            selectedComponent,
            connectedDevices,
            deviceDetails,
            selectComponent,
            setAttributeExpanded,
            readCharacteristic,
            writeCharacteristic,
            readDescriptor,
            writeDescriptor,
            showSetupDialog,
            showParamsDialog,
            showConnectionDialog,
            toggleAdvertising,
            disconnectFromDevice,
            // pairWithDevice,
            createUserInitiatedConnParamsUpdateEvent,
            createUserInitiatedPhyUpdateEvent,
            createUserInitiatedMtuUpdateEvent,
            createUserInitiatedDataLengthUpdateEvent,
            createUserInitiatedPairingEvent,
            toggleAutoConnUpdate,
            autoConnUpdate,
            showSecurityParamsDialog,
            toggleAutoAcceptPairing,
            deleteBondInfo,
            security,
            openCustomUuidFile,
            showDfuDialog,
        } = this.props;

        const elemWidth = 250;
        const detailDevices = [];

        if (!adapterState) {
            return <div className="device-details-container" />;
        }

        // Details for connected adapter
        detailDevices.push(
            <DeviceDetailsView
                key={adapterState.instanceId}
                device={adapterState}
                selected={selectedComponent}
                deviceDetails={deviceDetails}
                onSelectComponent={selectComponent}
                onSetAttributeExpanded={setAttributeExpanded}
                onReadCharacteristic={readCharacteristic}
                onWriteCharacteristic={writeCharacteristic}
                onReadDescriptor={readDescriptor}
                onWriteDescriptor={writeDescriptor}
                onShowAdvertisingSetupDialog={showSetupDialog}
                onShowAdvertisingParameterDialog={showParamsDialog}
                onShowConnectionParamsDialog={showConnectionDialog}
                onToggleAdvertising={toggleAdvertising}
                onToggleAutoConnUpdate={toggleAutoConnUpdate}
                autoConnUpdate={autoConnUpdate}
                onShowSecurityParamsDialog={showSecurityParamsDialog}
                onToggleAutoAcceptPairing={toggleAutoAcceptPairing}
                onDeleteBondInfo={deleteBondInfo}
                security={security}
                onOpenCustomUuidFile={openCustomUuidFile}
            />
        );

        // Details for connected devices
        connectedDevices.forEach(device => {
            detailDevices.push(
                <DeviceDetailsView
                    key={device.instanceId}
                    adapter={adapterState}
                    device={device}
                    selected={selectedComponent}
                    deviceDetails={deviceDetails}
                    connectedDevicesNumber={connectedDevices.size}
                    onShowDfuDialog={showDfuDialog}
                    onSelectComponent={selectComponent}
                    onSetAttributeExpanded={setAttributeExpanded}
                    onReadCharacteristic={readCharacteristic}
                    onWriteCharacteristic={writeCharacteristic}
                    onReadDescriptor={readDescriptor}
                    onWriteDescriptor={writeDescriptor}
                    onDisconnectFromDevice={disconnectFromDevice}
                    onPairWithDevice={createUserInitiatedPairingEvent}
                    onUpdateDeviceConnectionParams={
                        createUserInitiatedConnParamsUpdateEvent
                    }
                    onUpdateDevicePhy={createUserInitiatedPhyUpdateEvent}
                    onUpdateDeviceMtu={createUserInitiatedMtuUpdateEvent}
                    onUpdateDeviceDataLength={
                        createUserInitiatedDataLengthUpdateEvent
                    }
                />
            );
        });

        const perDevice = 20 + elemWidth;
        const width = perDevice * detailDevices.length;

        // TODO: Fix better solution to right padding of scroll area than div box with border
        return (
            <>
                <div className="device-details-container">
                    <div style={{ width }}>
                        {detailDevices}
                        <div
                            style={{
                                borderColor: 'transparent',
                                borderLeftWidth: '20px',
                                borderRightWidth: '0px',
                                borderStyle: 'solid',
                            }}
                        />
                    </div>
                </div>
                <DfuDialog />
            </>
        );
    }
}

function mapStateToProps(state) {
    const { adapter } = state.app;

    const { selectedAdapter } = adapter;

    if (!selectedAdapter) {
        return {};
    }

    return {
        adapterState: selectedAdapter.state,
        selectedComponent:
            selectedAdapter.deviceDetails &&
            selectedAdapter.deviceDetails.selectedComponent,
        connectedDevices: selectedAdapter.connectedDevices,
        deviceDetails: selectedAdapter.deviceDetails,
        autoConnUpdate: adapter.autoConnUpdate,
        security: selectedAdapter.security,
    };
}

function mapDispatchToProps(dispatch) {
    const retval = {
        ...bindActionCreators(DeviceDetailsActions, dispatch),
        ...bindActionCreators(AdvertisingActions, dispatch),
        ...bindActionCreators(AdapterActions, dispatch),
        ...bindActionCreators(BLEEventActions, dispatch),
        ...bindActionCreators(SecurityActions, dispatch),
        ...bindActionCreators(DfuActions, dispatch),
    };

    return retval;
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withHotkey(DeviceDetailsContainer));

DeviceDetailsContainer.propTypes = {
    adapterState: PropTypes.object,
    selectedComponent: PropTypes.string,
    deviceDetails: PropTypes.object,
    connectedDevices: PropTypes.object,
    // deviceServers: PropTypes.object,
    readCharacteristic: PropTypes.func.isRequired,
    writeCharacteristic: PropTypes.func.isRequired,
    readDescriptor: PropTypes.func.isRequired,
    writeDescriptor: PropTypes.func.isRequired,
    createUserInitiatedConnParamsUpdateEvent: PropTypes.func.isRequired,
    createUserInitiatedPhyUpdateEvent: PropTypes.func.isRequired,
    createUserInitiatedMtuUpdateEvent: PropTypes.func.isRequired,
    createUserInitiatedDataLengthUpdateEvent: PropTypes.func.isRequired,
    createUserInitiatedPairingEvent: PropTypes.func.isRequired,
    security: PropTypes.object,
    toggleAutoAcceptPairing: PropTypes.func.isRequired,
    deleteBondInfo: PropTypes.func.isRequired,
    showSecurityParamsDialog: PropTypes.func.isRequired,
    openCustomUuidFile: PropTypes.func.isRequired,
    selectComponent: PropTypes.func.isRequired,
    setAttributeExpanded: PropTypes.func.isRequired,
    showSetupDialog: PropTypes.func.isRequired,
    showParamsDialog: PropTypes.func.isRequired,
    showConnectionDialog: PropTypes.func.isRequired,
    toggleAdvertising: PropTypes.func.isRequired,
    disconnectFromDevice: PropTypes.func.isRequired,
    toggleAutoConnUpdate: PropTypes.func.isRequired,
    autoConnUpdate: PropTypes.bool,
    showDfuDialog: PropTypes.func.isRequired,
    bindHotkey: PropTypes.func.isRequired,
};

DeviceDetailsContainer.defaultProps = {
    adapterState: null,
    selectedComponent: null,
    deviceDetails: null,
    connectedDevices: null,
    security: null,
    autoConnUpdate: false,
};
