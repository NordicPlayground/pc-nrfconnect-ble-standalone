/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint react/forbid-prop-types: off */

'use strict';

import React, { useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import dfuIcon from '../../resources/dfu_icon.png';
import Connector from './Connector';

const WINDOW_WIDTH_OFFSET = 375;
const THROTTLE_TIMEOUT = 100;

const ConnectedDevice = ({
    id,
    device,
    sourceId,
    layout,
    connectedDevicesNumber,
    isDfuSupported,
    onClickDfu,
    onDisconnect,
    onPair,
    onConnectionParamsUpdate,
    onPhyUpdate,
    onMtuUpdate,
    onDataLengthUpdate,
}) => {
    const node = useRef(null);
    const [boundingRect, setBoundingRect] = useState(null);
    const [, setBelowWidthThreshold] = useState(false);
    const [resizeTimeout, setResizeTimeout] = useState(null);

    const sdApiVersion = useSelector(
        ({ app }) =>
            // eslint-disable-next-line no-underscore-dangle
            app.adapter.bleDriver.adapter._bleDriver.NRF_SD_BLE_API_VERSION
    );

    const onResize = () => {
        if (!boundingRect) {
            return;
        }
        setBelowWidthThreshold(
            window.innerWidth < boundingRect.right + WINDOW_WIDTH_OFFSET
        );
    };

    const resizeThrottler = () => {
        if (resizeTimeout) {
            return;
        }

        setResizeTimeout(
            setTimeout(() => {
                setResizeTimeout(null);
                onResize();
            }, THROTTLE_TIMEOUT)
        );
    };

    useEffect(() => {
        // componentDidMount()
        window.addEventListener('resize', resizeThrottler);
        if (node.current) {
            setBoundingRect(node.current.getBoundingClientRect());
        }
        // componentWillUnmount()
        return () => {
            window.removeEventListener('resize', resizeThrottler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSelect = eventKey => {
        switch (eventKey) {
            case 'Disconnect':
                onDisconnect();
                break;
            case 'UpdateConnectionParams':
                onConnectionParamsUpdate(device);
                break;
            case 'UpdatePhy':
                onPhyUpdate(device);
                break;
            case 'UpdateMtu':
                onMtuUpdate(device);
                break;
            case 'UpdateDataLength':
                onDataLengthUpdate(device);
                break;
            case 'Pair':
                onPair();
                break;
            default:
                console.log('Unknown eventKey received:', eventKey);
        }
    };

    const role = device.role === 'central' ? 'Central' : 'Peripheral';
    const mtuDisable = device.mtu > 23;

    const style = {
        opacity: device.connected === true ? 1.0 : 0.5,
    };

    return (
        <div ref={node} id={id} className="device standalone" style={style}>
            <div className="top-bar">
                <div className="flag-line" />
            </div>

            <div className="device-body text-small">
                <div>
                    <div className="pull-right">
                        {isDfuSupported && (
                            <Button
                                id="dfuButton"
                                variant="primary"
                                className="btn-nordic btn-xs"
                                size="sm"
                                title="Start Secure DFU"
                                onClick={onClickDfu}
                            >
                                <img
                                    src={dfuIcon}
                                    className="icon-dfu-button"
                                    alt=""
                                />
                            </Button>
                        )}
                        <Dropdown
                            id="connectionDropDown"
                            onClick={onResize}
                            onSelect={onSelect}
                        >
                            <Dropdown.Toggle>
                                <span
                                    className="mdi mdi-settings"
                                    aria-hidden="true"
                                />
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item
                                    id="updateConnectionMenuItem"
                                    eventKey="UpdateConnectionParams"
                                >
                                    Update connection...
                                </Dropdown.Item>
                                {sdApiVersion >= 5 && (
                                    <>
                                        <Dropdown.Item
                                            id="updatePhyMenuItem"
                                            eventKey="UpdatePhy"
                                        >
                                            Update phy...
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id="updateDataLengthMenuItem"
                                            eventKey="UpdateDataLength"
                                            title="Length of data payload of link layer packets"
                                        >
                                            Update data length...
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id="updateMtuMenuItem"
                                            eventKey="UpdateMtu"
                                            disabled={mtuDisable}
                                            title="ATT maximum transfer unit, length of an ATT packet"
                                        >
                                            Update MTU...
                                        </Dropdown.Item>
                                    </>
                                )}
                                <Dropdown.Divider key="dividerPair" />
                                <Dropdown.Item
                                    id="pairMenuItem"
                                    eventKey="Pair"
                                >
                                    Pair...
                                </Dropdown.Item>
                                <Dropdown.Divider key="dividerDisconnect" />
                                <Dropdown.Item
                                    id="disconnectMenuItem"
                                    eventKey="Disconnect"
                                >
                                    Disconnect
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                    <div className="role-flag pull-right">{role}</div>
                    <strong className="selectable">
                        {device.name ? device.name : '<Unknown>'}
                    </strong>
                </div>
                <div className="address-text selectable">{device.address}</div>
            </div>
            <Connector
                sourceId={sourceId}
                targetId={id}
                device={device}
                layout={layout}
                connectedDevicesNumber={connectedDevicesNumber}
            />
        </div>
    );

    // TODO: later on, we must implement a transition of data from device discovery flags
    // TODO: to connected devices.
    //
    // <div className='flag-line'>
    //     {device.services.map((service, index) => {
    //         return (<div key={index} className='device-flag'>{service}</div>);
    //     })}
    // </div>
};

ConnectedDevice.propTypes = {
    id: PropTypes.string.isRequired,
    device: PropTypes.object.isRequired,
    sourceId: PropTypes.string.isRequired,
    layout: PropTypes.string.isRequired,
    connectedDevicesNumber: PropTypes.number.isRequired,
    isDfuSupported: PropTypes.bool.isRequired,
    onClickDfu: PropTypes.func.isRequired,
    onDisconnect: PropTypes.func.isRequired,
    onPair: PropTypes.func.isRequired,
    onConnectionParamsUpdate: PropTypes.func.isRequired,
    onPhyUpdate: PropTypes.func.isRequired,
    onMtuUpdate: PropTypes.func.isRequired,
    onDataLengthUpdate: PropTypes.func.isRequired,
};

export default ConnectedDevice;
