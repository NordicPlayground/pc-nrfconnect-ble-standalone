/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint jsx-a11y/label-has-for: off */
/* eslint jsx-a11y/label-has-associated-control: off */

'use strict';

import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { BLEEventType } from '../actions/common';
import { Event } from '../reducers/bleEventReducer';
import ActionButton from './ActionButton';
import TextInput from './input/TextInput';

const {
    PEER_CENTRAL_INITIATED_CONNECTION_UPDATE,
    PEER_PERIPHERAL_INITIATED_CONNECTION_UPDATE,
    USER_INITIATED_CONNECTION_UPDATE,
} = BLEEventType;

const CONN_INTERVAL_MIN = 7.5;
const CONN_INTERVAL_MAX = 4000;
const CONN_INTERVAL_STEP = 1.25;
const CONN_TIMEOUT_MIN = 100;
const CONN_TIMEOUT_MAX = 32000;
const CONN_TIMEOUT_STEP = 10;
const CONN_LATENCY_MIN = 0;
const CONN_LATENCY_MAX = 499;
const CONN_LATENCY_STEP = 1;

export {
    CONN_INTERVAL_MIN,
    CONN_INTERVAL_MAX,
    CONN_TIMEOUT_MIN,
    CONN_TIMEOUT_MAX,
    CONN_TIMEOUT_STEP,
    CONN_LATENCY_MIN,
    CONN_LATENCY_MAX,
    CONN_INTERVAL_STEP,
};

export function isInRange(value, min, max) {
    return value >= min && value <= max;
}

export const validInputStyle = {
    boxShadow:
        'inset 0 1px 1px rgba(0,0,0,.075), 0 0 8px rgba(102, 175, 233, 0.6)',
    borderColor: '#66afe9',
};

export const invalidInputStyle = {
    boxShadow: 'inset 0 1px 1px rgba(0,0,0,.075), 0 0 5px rgba(255, 0, 0, 1)',
    borderColor: 'rgb(200, 10, 10)',
};

// This component views an editor for connection update parameters
// One concept is essential:
//  If the user sets an connectionInterval we force that value to the SoftDevice
//  by setting both maxConnectionInterval and minConnection interval to that value.
const ConnectionUpdateRequestEditor = ({
    event: { id, type, requestedConnectionParams: rcp, device },
    onIgnoreEvent,
    onUpdateConnectionParams,
    onRejectConnectionParams,
    onCancelUserInitiatedEvent,
}) => {
    const { address } = device;

    const [connectionInterval, setConnectionInterval] = useState(
        rcp.minConnectionInterval
    );
    const [connectionSupervisionTimeout, setConnectionSupervisionTimeout] =
        useState(rcp.connectionSupervisionTimeout);
    const [slaveLatency, setSlaveLatency] = useState(rcp.slaveLatency);

    const readOnly = type === PEER_CENTRAL_INITIATED_CONNECTION_UPDATE;

    const isSlaveLatencyValid = isInRange(
        slaveLatency,
        CONN_LATENCY_MIN,
        CONN_LATENCY_MAX
    );

    const isConnectionSupervisionTimeoutValid = isInRange(
        connectionSupervisionTimeout,
        CONN_TIMEOUT_MIN,
        CONN_TIMEOUT_MAX
    );

    const isConnectionIntervalValid = isInRange(
        connectionInterval,
        CONN_INTERVAL_MIN,
        CONN_INTERVAL_MAX
    );

    const disabled =
        !isSlaveLatencyValid || !isConnectionSupervisionTimeoutValid;

    return (
        <div>
            <div className="event-header">
                <h4>
                    {type === USER_INITIATED_CONNECTION_UPDATE &&
                        `Connection parameters update for device ${address}`}
                    {type === PEER_PERIPHERAL_INITIATED_CONNECTION_UPDATE &&
                        `Connection parameters update request from device ${address}`}
                    {type === PEER_CENTRAL_INITIATED_CONNECTION_UPDATE &&
                        `Connection parameters updated by peer central ${address}`}
                </h4>
            </div>
            <form className="form-horizontal">
                <TextInput
                    style={
                        isConnectionIntervalValid
                            ? validInputStyle
                            : invalidInputStyle
                    }
                    id={`interval_${address}`}
                    className="form-control nordic-form-control"
                    onChange={({ target }) => {
                        if (target.value === '') {
                            return;
                        }
                        setConnectionInterval(parseFloat(target.value));
                    }}
                    type="number"
                    min={CONN_INTERVAL_MIN}
                    max={CONN_INTERVAL_MAX}
                    step={CONN_INTERVAL_STEP}
                    value={`${connectionInterval}`}
                    readOnly={readOnly}
                    label={`Connection Interval (ms) ${
                        type === USER_INITIATED_CONNECTION_UPDATE ? (
                            ''
                        ) : (
                            <div>
                                ({rcp.minConnectionInterval}-
                                {rcp.maxConnectionInterval})
                            </div>
                        )
                    }`}
                    labelClassName="col-md-7 text-right"
                    wrapperClassName="col-md-5"
                />
                <TextInput
                    style={
                        isSlaveLatencyValid
                            ? validInputStyle
                            : invalidInputStyle
                    }
                    id={`latency_${address}`}
                    className="form-control nordic-form-control"
                    onChange={({ target }) => {
                        setSlaveLatency(parseInt(target.value, 10));
                    }}
                    type="number"
                    value={slaveLatency}
                    min={CONN_LATENCY_MIN}
                    max={CONN_LATENCY_MAX}
                    step={CONN_LATENCY_STEP}
                    readOnly={readOnly}
                    label="Slave latency"
                    labelClassName="col-md-7 text-right"
                    wrapperClassName="col-md-5"
                />
                <TextInput
                    style={
                        isConnectionSupervisionTimeoutValid
                            ? validInputStyle
                            : invalidInputStyle
                    }
                    id={`timeout_${address}`}
                    className="form-control nordic-form-control"
                    onChange={({ target }) => {
                        setConnectionSupervisionTimeout(
                            parseInt(target.value, 10)
                        );
                    }}
                    type="number"
                    min={CONN_TIMEOUT_MIN}
                    max={CONN_TIMEOUT_MAX}
                    step={CONN_TIMEOUT_STEP}
                    readOnly={readOnly}
                    value={connectionSupervisionTimeout}
                    label="Connection supervision timeout (ms)"
                    labelClassName="col-md-7 text-right"
                    wrapperClassName="col-md-5"
                />
                <div className="row-of-buttons">
                    {type === PEER_PERIPHERAL_INITIATED_CONNECTION_UPDATE && (
                        <>
                            <ActionButton
                                label="Ignore"
                                onClick={() => onIgnoreEvent(id)}
                            />
                            <ActionButton
                                label="Reject"
                                onClick={() => onRejectConnectionParams(device)}
                            />
                        </>
                    )}

                    {type === PEER_CENTRAL_INITIATED_CONNECTION_UPDATE ? (
                        <>
                            <ActionButton
                                label="Accept"
                                onClick={() => onUpdateConnectionParams(id)}
                                primary
                                disabled={disabled}
                            />
                            <ActionButton
                                label="Disconnect"
                                onClick={() => onRejectConnectionParams(device)}
                            />
                        </>
                    ) : (
                        <ActionButton
                            label="Update"
                            onClick={() => {
                                // Set minConnectionInterval and maxConnectionInterval
                                // to connectionInterval
                                // that way we force the connectionInterval on SoftDevice.
                                onUpdateConnectionParams(device, {
                                    minConnectionInterval: connectionInterval,
                                    maxConnectionInterval: connectionInterval,
                                    slaveLatency,
                                    connectionSupervisionTimeout,
                                });
                            }}
                            primary
                            disabled={disabled}
                        />
                    )}

                    {type === USER_INITIATED_CONNECTION_UPDATE && (
                        <ActionButton
                            label="Cancel"
                            onClick={() => onCancelUserInitiatedEvent(id)}
                        />
                    )}
                </div>
            </form>
        </div>
    );
};

ConnectionUpdateRequestEditor.propTypes = {
    event: PropTypes.instanceOf(Event).isRequired,
    onRejectConnectionParams: PropTypes.func.isRequired,
    onUpdateConnectionParams: PropTypes.func.isRequired,
    onIgnoreEvent: PropTypes.func.isRequired,
    onCancelUserInitiatedEvent: PropTypes.func.isRequired,
};

export default ConnectionUpdateRequestEditor;
