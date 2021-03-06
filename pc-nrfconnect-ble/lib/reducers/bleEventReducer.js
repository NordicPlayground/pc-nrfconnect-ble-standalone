/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

'use strict';

import { Map, Record } from 'immutable';

import * as AdapterActions from '../actions/adapterActions';
import * as BLEEventActions from '../actions/bleEventActions';
import { BLEEventState, BLEEventType, BLEPHYType } from '../actions/common';
import * as apiHelper from '../utils/api';
import { getImmutableSecurityParameters } from './securityReducer';

const InitialState = Record({
    visible: false,
    events: Map(),
    selectedEventId: -1,
});

const initialState = new InitialState();

export const Event = Record({
    id: null,
    type: null,
    device: null,
    requestedConnectionParams: null,
    requestedPhyParams: null,
    requestedMtu: null,
    requestedDataLength: null,
    pairingParameters: null,
    authKeyParams: null,
    ownOobData: null,
    state: BLEEventState.UNKNOWN,
    receiveKeypressEnabled: false,
    keypressStartReceived: false,
    keypressEndReceived: false,
    sendKeypressEnabled: false,
    keypressStartSent: false,
    keypressEndSent: false,
    keypressCount: 0,
});

const ConnectionParameters = Record({
    connectionSupervisionTimeout: 0,
    maxConnectionInterval: 0,
    minConnectionInterval: 0,
    slaveLatency: 0,
});

const AuthKeyParameters = Record({
    passkey: '',
});

const PhyParameters = Record({
    txPhy: BLEPHYType.BLE_GAP_PHY_AUTO,
    rxPhy: BLEPHYType.BLE_GAP_PHY_AUTO,
});

// Module local variable that is used to generate a unique ID for all events that are
// added by the user or by incoming connection parameter update requests.
let eventIndex = 0;

function resetSelectedEventIdAndEventIndex(state) {
    eventIndex = 0;
    return state.set('selectedEventId', -1);
}

function showDialog(state, visible) {
    return state.set('visible', visible);
}

function clearAllEvents(state) {
    return resetSelectedEventIdAndEventIndex(state).set(
        'events',
        state.events.clear()
    );
}

function connectionUpdateParamRequest(
    state,
    device,
    requestedConnectionParams
) {
    const connectionParams = new ConnectionParameters({
        connectionSupervisionTimeout:
            requestedConnectionParams.connectionSupervisionTimeout,
        maxConnectionInterval: requestedConnectionParams.maxConnectionInterval,
        minConnectionInterval: requestedConnectionParams.minConnectionInterval,
        slaveLatency: requestedConnectionParams.slaveLatency,
    });

    const type =
        device.role === 'central'
            ? BLEEventType.PEER_CENTRAL_INITIATED_CONNECTION_UPDATE
            : BLEEventType.PEER_PERIPHERAL_INITIATED_CONNECTION_UPDATE;

    const event = new Event({
        type,
        device: apiHelper.getImmutableDevice(device),
        requestedConnectionParams: connectionParams,
        id: eventIndex,
        state: BLEEventState.INDETERMINATE,
    });

    let newState = state.setIn(['events', eventIndex], event);
    newState = newState.set('selectedEventId', eventIndex);
    newState = newState.set('visible', true);
    eventIndex += 1;

    return newState;
}

function phyUpdateRequest(state, device, requestedPhyParams) {
    const phyParams = new PhyParameters({
        txPhy: requestedPhyParams.tx_phys,
        rxPhy: requestedPhyParams.rx_phys,
    });

    const event = new Event({
        type: BLEEventType.PEER_INITIATED_PHY_UPDATE,
        device: apiHelper.getImmutableDevice(device),
        requestedPhyParams: phyParams,
        id: eventIndex,
        state: BLEEventState.INDETERMINATE,
    });

    let newState = state.setIn(['events', eventIndex], event);
    newState = newState.set('selectedEventId', eventIndex);
    newState = newState.set('visible', true);
    eventIndex += 1;

    return newState;
}

function mtuUpdateRequest(state, device, requestedMtu) {
    const event = new Event({
        type: BLEEventType.PEER_INITIATED_MTU_UPDATE,
        device: apiHelper.getImmutableDevice(device),
        requestedMtu,
        id: eventIndex,
        state: BLEEventState.INDETERMINATE,
    });

    let newState = state.setIn(['events', eventIndex], event);
    newState = newState.set('selectedEventId', eventIndex);
    newState = newState.set('visible', true);
    eventIndex += 1;

    return newState;
}

function dataLengthUpdateRequest(state, device, requestedDataLength) {
    const event = new Event({
        type: BLEEventType.PEER_INITIATED_DATA_LENGTH_UPDATE,
        device: apiHelper.getImmutableDevice(device),
        requestedDataLength,
        id: eventIndex,
        state: BLEEventState.INDETERMINATE,
    });

    let newState = state.setIn(['events', eventIndex], event);
    newState = newState.set('selectedEventId', eventIndex);
    newState = newState.set('visible', true);
    eventIndex += 1;

    return newState;
}

function updateEventStatus(state, eventId, eventState) {
    if (eventId < 0) {
        return state;
    }

    return state.setIn(['events', eventId, 'state'], eventState);
}

function selectEventId(state, selectedEventId) {
    return state.set('selectedEventId', selectedEventId);
}

function updateEventKeypressCount(oldState, eventId, keypressType) {
    let state = oldState;
    if (eventId < 0) {
        return state;
    }

    let keypressCount = state.getIn(['events', eventId, 'keypressCount']);

    switch (keypressType) {
        case 'BLE_GAP_KP_NOT_TYPE_PASSKEY_DIGIT_IN':
            keypressCount += 1;
            break;
        case 'BLE_GAP_KP_NOT_TYPE_PASSKEY_DIGIT_OUT':
            keypressCount -= 1;
            break;
        case 'BLE_GAP_KP_NOT_TYPE_PASSKEY_CLEAR':
            keypressCount = 0;
            break;
        case 'BLE_GAP_KP_NOT_TYPE_PASSKEY_START':
            state = state.setIn(
                ['events', eventId, 'keypressStartReceived'],
                true
            );
            break;
        case 'BLE_GAP_KP_NOT_TYPE_PASSKEY_END':
            state = state.setIn(
                ['events', eventId, 'keypressEndReceived'],
                true
            );
            break;
        default:
    }

    return state.setIn(['events', eventId, 'keypressCount'], keypressCount);
}

function passkeyKeypressReceived(oldState, device, keypressType) {
    let state = oldState;
    const events = state.events.filter(
        value =>
            value.state === BLEEventState.INDETERMINATE &&
            value.device.instanceId === device.instanceId
    );

    events.forEach(event => {
        if (
            event.type === BLEEventType.PASSKEY_DISPLAY &&
            event.receiveKeypressEnabled === true
        ) {
            state = updateEventKeypressCount(state, event.id, keypressType);
        }
    });

    return state;
}

function deviceDisconnected(oldState, device) {
    let state = oldState;
    // Find given device event that has state INDETERMINATE and set it to DISCONNECTED
    const events = state.events.filter(
        value =>
            value.state === BLEEventState.INDETERMINATE &&
            value.device.instanceId === device.instanceId
    );

    events.forEach(event => {
        state = updateEventStatus(state, event.id, BLEEventState.DISCONNECTED);
    });

    return state;
}

function ignoreEvent(state, eventId) {
    return state.setIn(['events', eventId, 'state'], BLEEventState.IGNORED);
}

function acceptEvent(state, eventId) {
    return state.setIn(['events', eventId, 'state'], BLEEventState.SUCCESS);
}

function removeEvent(oldState, eventId) {
    let state = oldState;
    if (state.selectedEventId === eventId) {
        state = state.set('selectedEventId', -1);
    }

    return state.deleteIn(['events', eventId]);
}

function createUserInitiatedConnParamsUpdateEvent(state, device) {
    // Information regarding BLE parameters are taken from:
    // https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.gap.peripheral_preferred_connection_parameters.xml
    const initialConnectionParams = new ConnectionParameters({
        connectionSupervisionTimeout: device.connectionSupervisionTimeout,
        maxConnectionInterval: device.maxConnectionInterval,
        minConnectionInterval: device.minConnectionInterval,
        slaveLatency: device.slaveLatency,
    });

    const event = new Event({
        type: BLEEventType.USER_INITIATED_CONNECTION_UPDATE,
        device: apiHelper.getImmutableDevice(device),
        requestedConnectionParams: initialConnectionParams,
        id: eventIndex,
        state: BLEEventState.INDETERMINATE,
    });

    let newState = state.setIn(['events', eventIndex], event);
    newState = newState.set('selectedEventId', eventIndex);
    newState = newState.set('visible', true);
    eventIndex += 1;

    return newState;
}

function createUserInitiatedPhyUpdateEvent(state, device) {
    const event = new Event({
        type: BLEEventType.USER_INITIATED_PHY_UPDATE,
        device: apiHelper.getImmutableDevice(device),
        requestedPhyParams: new PhyParameters({
            rxPhy: device.rxPhy,
            txPhy: device.txPhy,
        }),
        id: eventIndex,
        state: BLEEventState.INDETERMINATE,
    });

    let newState = state.setIn(['events', eventIndex], event);
    newState = newState.set('selectedEventId', eventIndex);
    newState = newState.set('visible', true);
    eventIndex += 1;

    return newState;
}

function createUserInitiatedMtuUpdateEvent(state, device) {
    const event = new Event({
        type: BLEEventType.USER_INITIATED_MTU_UPDATE,
        device: apiHelper.getImmutableDevice(device),
        requestedMtu: device.mtu,
        id: eventIndex,
        state: BLEEventState.INDETERMINATE,
    });

    let newState = state.setIn(['events', eventIndex], event);
    newState = newState.set('selectedEventId', eventIndex);
    newState = newState.set('visible', true);
    eventIndex += 1;

    return newState;
}

function createUserInitiatedDataLengthUpdateEvent(state, device) {
    const event = new Event({
        type: BLEEventType.USER_INITIATED_DATA_LENGTH_UPDATE,
        device: apiHelper.getImmutableDevice(device),
        requestedDataLength: 251,
        id: eventIndex,
        state: BLEEventState.INDETERMINATE,
    });

    let newState = state.setIn(['events', eventIndex], event);
    newState = newState.set('selectedEventId', eventIndex);
    newState = newState.set('visible', true);
    eventIndex += 1;

    return newState;
}

function securityRequest(state, device, secParams) {
    const immutableSecParams = getImmutableSecurityParameters(secParams);

    const event = new Event({
        type: BLEEventType.PEER_INITIATED_PAIRING,
        device: apiHelper.getImmutableDevice(device),
        pairingParameters: immutableSecParams,
        id: eventIndex,
        state: BLEEventState.INDETERMINATE,
    });

    let newState = state.setIn(['events', eventIndex], event);
    newState = newState.set('selectedEventId', eventIndex);
    newState = newState.set('visible', true);
    eventIndex += 1;

    return newState;
}

function passkeyDisplay(state, device, matchRequest, passkey, receiveKeypress) {
    const eventType = matchRequest
        ? BLEEventType.NUMERICAL_COMPARISON
        : BLEEventType.PASSKEY_DISPLAY;

    const keyParams = new AuthKeyParameters({
        passkey,
    });

    const event = new Event({
        type: eventType,
        device: apiHelper.getImmutableDevice(device),
        authKeyParams: keyParams,
        id: eventIndex,
        state: BLEEventState.INDETERMINATE,
        receiveKeypressEnabled: receiveKeypress,
    });

    let newState = state.setIn(['events', eventIndex], event);
    newState = newState.set('selectedEventId', eventIndex);
    newState = newState.set('visible', true);
    eventIndex += 1;

    return newState;
}

function passkeyKeypressSent(state, eventId, keypressType) {
    if (eventId < 0) {
        return state;
    }

    let keypressCount = state.getIn(['events', eventId, 'keypressCount']);

    if (keypressType === 'BLE_GAP_KP_NOT_TYPE_PASSKEY_START') {
        return state.setIn(['events', eventId, 'keypressStartSent'], true);
    }
    if (keypressType === 'BLE_GAP_KP_NOT_TYPE_PASSKEY_END') {
        return state.setIn(['events', eventId, 'keypressEndSent'], true);
    }
    if (keypressType === 'BLE_GAP_KP_NOT_TYPE_PASSKEY_DIGIT_IN') {
        keypressCount += 1;
        return state.setIn(['events', eventId, 'keypressCount'], keypressCount);
    }
    if (keypressType === 'BLE_GAP_KP_NOT_TYPE_PASSKEY_DIGIT_OUT') {
        keypressCount -= 1;
        return state.setIn(['events', eventId, 'keypressCount'], keypressCount);
    }
    if (keypressType === 'BLE_GAP_KP_NOT_TYPE_PASSKEY_CLEAR') {
        return state.setIn(['events', eventId, 'keypressCount'], 0);
    }

    return state;
}

function authKeyRequest(state, device, keyType, sendKeypress) {
    const eventTypeValues = {
        BLE_GAP_AUTH_KEY_TYPE_PASSKEY: BLEEventType.PASSKEY_REQUEST,
        BLE_GAP_AUTH_KEY_TYPE_OOB: BLEEventType.LEGACY_OOB_REQUEST,
    };
    const eventType = eventTypeValues[keyType] || null;

    const event = new Event({
        type: eventType,
        device: apiHelper.getImmutableDevice(device),
        id: eventIndex,
        state: BLEEventState.INDETERMINATE,
        sendKeypressEnabled: sendKeypress,
    });

    let newState = state.setIn(['events', eventIndex], event);
    newState = newState.set('selectedEventId', eventIndex);
    newState = newState.set('visible', true);
    eventIndex += 1;

    return newState;
}

function lescOobRequest(state, device, ownOobData) {
    const event = new Event({
        type: BLEEventType.LESC_OOB_REQUEST,
        device: apiHelper.getImmutableDevice(device),
        id: eventIndex,
        state: BLEEventState.INDETERMINATE,
        ownOobData,
    });

    let newState = state.setIn(['events', eventIndex], event);
    newState = newState.set('selectedEventId', eventIndex);
    newState = newState.set('visible', true);
    eventIndex += 1;

    return newState;
}

function createUserInitiatedPairingEvent(state, device, defaultSecParams) {
    const immutableSecParams = getImmutableSecurityParameters(defaultSecParams);

    const event = new Event({
        type: BLEEventType.USER_INITIATED_PAIRING,
        device: apiHelper.getImmutableDevice(device),
        pairingParameters: immutableSecParams,
        id: eventIndex,
        state: BLEEventState.INDETERMINATE,
    });

    let newState = state.setIn(['events', eventIndex], event);
    newState = newState.set('selectedEventId', eventIndex);
    newState = newState.set('visible', true);
    eventIndex += 1;

    return newState;
}

function authErrorOccured(oldState, device) {
    let state = oldState;
    if (!device) {
        return state;
    }

    // Find given device event that has state INDETERMINATE and set it to ERROR
    const events = state.events.filter(
        value =>
            (value.state === BLEEventState.INDETERMINATE ||
                value.state === BLEEventState.PENDING) &&
            value.device.instanceId === device.instanceId
    );

    events.forEach(event => {
        state = updateEventStatus(state, event.id, BLEEventState.ERROR);
    });

    return state;
}

function authSuccessOccured(oldState, device) {
    let state = oldState;
    if (!device) {
        return state;
    }

    // Find given device event that has state INDETERMINATE and set it to ERROR
    const events = state.events.filter(
        value =>
            (value.state === BLEEventState.INDETERMINATE ||
                value.state === BLEEventState.PENDING) &&
            value.device.instanceId === device.instanceId
    );

    events.forEach(event => {
        state = updateEventStatus(state, event.id, BLEEventState.SUCCESS);
    });

    return state;
}

function securityRequestTimedOut(state, device) {
    return authErrorOccured(state, device);
}

export default function bleEvent(state = initialState, action) {
    switch (action.type) {
        case BLEEventActions.BLE_EVENT_SHOW_DIALOG:
            return showDialog(state, action.visible);
        case BLEEventActions.BLE_EVENT_CLEAR_ALL_EVENTS:
            return clearAllEvents(state);
        case BLEEventActions.BLE_EVENT_SELECT_EVENT_ID:
            return selectEventId(state, action.selectedEventId);
        case BLEEventActions.BLE_EVENT_IGNORE:
            return ignoreEvent(state, action.eventId);
        case BLEEventActions.BLE_EVENT_ACCEPT:
            return acceptEvent(state, action.eventId);
        case BLEEventActions.BLE_EVENT_CREATE_USER_INITIATED_CONN_PARAMS_UPDATE_EVENT:
            return createUserInitiatedConnParamsUpdateEvent(
                state,
                action.device
            );
        case BLEEventActions.BLE_EVENT_CREATE_USER_INITIATED_PHY_UPDATE_EVENT:
            return createUserInitiatedPhyUpdateEvent(state, action.device);
        case BLEEventActions.BLE_EVENT_CREATE_USER_INITIATED_MTU_UPDATE_EVENT:
            return createUserInitiatedMtuUpdateEvent(state, action.device);
        case BLEEventActions.BLE_EVENT_CREATE_USER_INITIATED_DATA_LENGTH_UPDATE_EVENT:
            return createUserInitiatedDataLengthUpdateEvent(
                state,
                action.device
            );
        case BLEEventActions.BLE_EVENT_CREATE_USER_INITIATED_PAIRING_EVENT:
            return createUserInitiatedPairingEvent(
                state,
                action.device,
                action.defaultSecParams
            );
        case BLEEventActions.BLE_EVENT_REMOVE:
            return removeEvent(state, action.eventId);
        case AdapterActions.DEVICE_CONNECTION_PARAM_UPDATE_REQUEST:
            return connectionUpdateParamRequest(
                state,
                action.device,
                action.requestedConnectionParams
            );
        case AdapterActions.DEVICE_PHY_UPDATE_REQUEST:
            return phyUpdateRequest(
                state,
                action.device,
                action.requestedPhyParams
            );
        case AdapterActions.DEVICE_MTU_UPDATE_REQUEST:
            return mtuUpdateRequest(state, action.device, action.requestedMtu);
        case AdapterActions.DEVICE_DATA_LENGTH_UPDATE_REQUEST:
            return dataLengthUpdateRequest(
                state,
                action.device,
                action.requestedDataLength
            );
        case AdapterActions.DEVICE_SECURITY_REQUEST:
            return securityRequest(state, action.device, action.params);
        case AdapterActions.DEVICE_PASSKEY_DISPLAY:
            return passkeyDisplay(
                state,
                action.device,
                action.matchRequest,
                action.passkey,
                action.receiveKeypress
            );
        case AdapterActions.DEVICE_PASSKEY_KEYPRESS_SENT:
            return passkeyKeypressSent(
                state,
                action.eventId,
                action.keypressType
            );
        case AdapterActions.DEVICE_PASSKEY_KEYPRESS_RECEIVED:
            return passkeyKeypressReceived(
                state,
                action.device,
                action.keypressType
            );
        case AdapterActions.DEVICE_AUTHKEY_REQUEST:
            return authKeyRequest(
                state,
                action.device,
                action.keyType,
                action.sendKeypress
            );
        case AdapterActions.DEVICE_LESC_OOB_REQUEST:
            return lescOobRequest(state, action.device, action.ownOobData);
        case AdapterActions.DEVICE_AUTH_ERROR_OCCURED:
            return authErrorOccured(state, action.device);
        case AdapterActions.DEVICE_AUTH_SUCCESS_OCCURED:
            return authSuccessOccured(state, action.device);
        case AdapterActions.DEVICE_SECURITY_REQUEST_TIMEOUT:
            return securityRequestTimedOut(state, action.device);
        case AdapterActions.DEVICE_AUTHKEY_STATUS:
        case AdapterActions.DEVICE_PAIRING_STATUS:
        case AdapterActions.DEVICE_CONNECTION_PARAM_UPDATE_STATUS:
        case AdapterActions.DEVICE_PHY_UPDATE_STATUS:
        case AdapterActions.DEVICE_MTU_UPDATE_STATUS:
        case AdapterActions.DEVICE_DATA_LENGTH_UPDATE_STATUS:
            return updateEventStatus(state, action.id, action.status);
        case AdapterActions.DEVICE_DISCONNECTED:
            return deviceDisconnected(state, action.device);
        default:
            return state;
    }
}
