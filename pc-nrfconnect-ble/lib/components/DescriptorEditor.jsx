/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint react/forbid-prop-types: off */

'use strict';

import React from 'react';
import Button from 'react-bootstrap/Button';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Form from 'react-bootstrap/Form';
import PropTypes from 'prop-types';

import { ValidationError } from '../common/Errors';
import {
    getUuidName,
    uuidDescriptorDefinitions,
} from '../utils/uuid_definitions';
import { ERROR, SUCCESS, validateUuid } from '../utils/validateUuid';
import HexOnlyEditableField from './HexOnlyEditableField';
import LabeledInputGroup from './input/LabeledInputGroup';
import SelectList from './input/SelectList';
import TextInput from './input/TextInput';
import UuidInput from './input/UuidInput';

class DescriptorEditor extends React.PureComponent {
    constructor(props) {
        super(props);
        this.setInitialValue = this.setInitialValue.bind(this);
        this.saveAttribute = this.saveAttribute.bind(this);
        this.handleUuidSelect = this.handleUuidSelect.bind(this);
    }

    setCheckedProperty(property, e) {
        const { onModified } = this.props;
        this[property] = e.target.checked;
        this.forceUpdate();
        onModified(true);
    }

    setValueProperty(property, e) {
        const { onModified } = this.props;
        this[property] = e.target.value;
        this.forceUpdate();
        onModified(true);
    }

    setInitialValue(value) {
        const { onModified } = this.props;
        this.value = value;
        this.forceUpdate();
        onModified(true);
    }

    parseValueProperty(value) {
        if (value.length === 0) {
            return [];
        }

        if (typeof value === 'string') {
            const valueArray = value.split(' ');
            return valueArray.map(val => parseInt(val, 16));
        }

        return this.value;
    }

    validateValueLength() {
        const maxLength = parseInt(this.maxLength, 10);
        const { fixedLength } = this;
        const value = this.parseValueProperty(this.value);

        if (maxLength > 510 && fixedLength === true) {
            return ERROR;
        }

        if (maxLength > 512 && fixedLength === false) {
            return ERROR;
        }

        if (maxLength < value.length) {
            return ERROR;
        }

        return SUCCESS;
    }

    saveAttribute() {
        const {
            descriptor,
            onValidationError,
            onSaveChangedAttribute,
            onModified,
        } = this.props;
        if (validateUuid(this.uuid) === ERROR) {
            onValidationError(
                new ValidationError('You have to provide a valid UUID.')
            );
            return;
        }

        if (this.validateValueLength() === ERROR) {
            onValidationError(
                new ValidationError('Length of value is not valid.')
            );
            return;
        }

        const changedDescriptor = {
            instanceId: descriptor.instanceId,
            uuid: this.uuid.toUpperCase().trim(),
            name: this.name,
            value: this.parseValueProperty(this.value),
            readPerm: this.readPerm,
            writePerm: this.writePerm,
            fixedLength: this.fixedLength,
            maxLength: parseInt(this.maxLength, 10),
        };

        onSaveChangedAttribute(changedDescriptor);
        this.saved = true;
        onModified(false);
    }

    handleUuidSelect(uuid) {
        const { onModified } = this.props;
        this.uuid = uuid;
        const uuidName = getUuidName(this.uuid);

        if (this.uuid !== uuidName) {
            this.name = uuidName;
        }

        this.forceUpdate();
        onModified(true);
    }

    render() {
        const { descriptor, onRemoveAttribute } = this.props;

        const {
            instanceId,
            uuid,
            name,
            value,
            readPerm,
            writePerm,
            fixedLength,
            maxLength,
        } = descriptor;

        if (this.saved || this.instanceId !== instanceId) {
            this.saved = false;
            this.instanceId = instanceId;
            this.uuid = uuid || '';
            this.name = name;
            this.value = value.toArray();

            this.readPerm = readPerm;
            this.writePerm = writePerm;
            this.fixedLength = fixedLength === true;
            this.maxLength = maxLength;
        }

        return (
            <form className="form-horizontal native-key-bindings">
                <UuidInput
                    label="Descriptor UUID"
                    name="uuid"
                    value={this.uuid}
                    uuidDefinitions={uuidDescriptorDefinitions}
                    handleSelection={this.handleUuidSelect}
                />

                <TextInput
                    label="Descriptor name"
                    name="descriptor-name"
                    value={this.name}
                    onChange={e => this.setValueProperty('name', e)}
                />
                <HexOnlyEditableField
                    label="Initial value"
                    plain
                    className="form-control"
                    name="initial-value"
                    value={this.value}
                    onChange={this.setInitialValue}
                    labelClassName="col-md-3"
                    wrapperClassName="col-md-9"
                />

                <SelectList
                    label="Read permission"
                    type="select"
                    className="form-control"
                    value={this.readPerm}
                    onChange={e => this.setValueProperty('readPerm', e)}
                >
                    <option value="open">No security required</option>
                    <option value="encrypt">
                        Encryption required, no MITM
                    </option>
                    <option value="encrypt mitm-protection">
                        Encryption and MITM required
                    </option>
                    <option value="signed">
                        Signing or encryption required, no MITM
                    </option>
                    <option value="signed mitm-protection">
                        Signing or encryption with MITM required
                    </option>
                    <option value="no_access">
                        No access rights specified (undefined)
                    </option>
                </SelectList>

                <SelectList
                    label="Write permission"
                    type="select"
                    className="form-control"
                    value={this.writePerm}
                    onChange={e => this.setValueProperty('writePerm', e)}
                >
                    <option value="open">No security required</option>
                    <option value="encrypt">
                        Encryption required, no MITM
                    </option>
                    <option value="encrypt mitm-protection">
                        Encryption and MITM required
                    </option>
                    <option value="signed">
                        Signing or encryption required, no MITM
                    </option>
                    <option value="signed mitm-protection">
                        Signing or encryption with MITM required
                    </option>
                    <option value="no_access">
                        No access rights specified (undefined)
                    </option>
                </SelectList>

                <LabeledInputGroup label="Max length">
                    <Form.Group controlId="fixedLengthCheck">
                        <Form.Check
                            checked={this.fixedLength}
                            onChange={e =>
                                this.setCheckedProperty('fixedLength', e)
                            }
                            label="Fixed length"
                        />
                    </Form.Group>
                    <TextInput
                        inline
                        type="number"
                        min={0}
                        max={this.fixedLength ? 510 : 512}
                        name="max-length"
                        value={this.maxLength}
                        onChange={e => this.setValueProperty('maxLength', e)}
                    />
                </LabeledInputGroup>

                <ButtonToolbar>
                    <div className="col-md-4" />
                    <Button
                        variant="primary"
                        className="btn-nordic"
                        onClick={onRemoveAttribute}
                    >
                        <i className="mdi mdi-close" />
                        Delete
                    </Button>
                    <Button
                        variant="primary"
                        className="btn-nordic"
                        onClick={this.saveAttribute}
                    >
                        Save
                    </Button>
                </ButtonToolbar>
            </form>
        );
    }
}

DescriptorEditor.propTypes = {
    descriptor: PropTypes.object.isRequired,
    onRemoveAttribute: PropTypes.func.isRequired,
    onSaveChangedAttribute: PropTypes.func.isRequired,
    onValidationError: PropTypes.func.isRequired,
    onModified: PropTypes.func.isRequired,
};

export default DescriptorEditor;
