/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import {
    getInstanceIds,
    ImmutableCharacteristic,
    ImmutableDescriptor,
    ImmutableService,
} from '../utils/api';
import * as Colors from '../utils/colorDefinitions';
import { toHexString } from '../utils/stringUtil';
import AddNewItem from './AddNewItem';
import EnumeratingAttributes from './EnumeratingAttributes';

export const CCCD_UUID = '2902';

class AttributeItem extends React.Component {
    constructor(props) {
        super(props);
        this.backgroundColor = Colors.getColor('brand-base');
        this.bars = 0;
        this.expandable = true;
        this.attributeType = 'attribute';
        this.childAttributeType = 'service';

        this.childChanged = this.childChanged.bind(this);
        this.selectComponent = this.selectComponent.bind(this);
        this.onExpandAreaClick = this.onExpandAreaClick.bind(this);
        this.onAddAttribute = this.onAddAttribute.bind(this);
        this.onContentClick = this.onContentClick.bind(this);
    }

    componentDidUpdate(prevProps) {
        const { item, onChange } = this.props;
        if (item.value !== prevProps.item.value) {
            if (onChange) {
                onChange();
            }

            this.blink();
        }
    }

    onAddAttribute() {
        const { item, onAddCharacteristic, onAddDescriptor } = this.props;

        if (this.attributeType === 'service') {
            onAddCharacteristic(item);
        } else if (this.attributeType === 'characteristic') {
            onAddDescriptor(item);
        }
    }

    onExpandAreaClick(e) {
        const { item, onSetAttributeExpanded } = this.props;
        e.stopPropagation();
        if (onSetAttributeExpanded) {
            onSetAttributeExpanded(item, !item.expanded);
        }
        this.selectComponent();
    }

    onContentClick(e) {
        e.stopPropagation();
        this.selectComponent();
    }

    onWrite(value) {
        const { item, onWrite } = this.props;
        onWrite(item, value);
    }

    onRead() {
        const { item, onRead } = this.props;
        onRead(item);
    }

    getChildren() {
        const { item } = this.props;

        const { expanded, discoveringChildren, children } = item;

        const childrenList = [];

        if (discoveringChildren) {
            childrenList.push(
                <EnumeratingAttributes
                    key={`enumerating-${this.childAttributeType}`}
                    bars={this.bars + 1}
                />
            );
        } else if (children && expanded) {
            childrenList.push(this.renderChildren());
        }

        return childrenList;
    }

    childChanged() {
        const { item, onChange } = this.props;
        if (onChange) {
            onChange();
        }

        if (!item.expanded) {
            this.blink();
        }
    }

    blink() {
        const fromColor = Colors.getColor('brand-primary');
        const toColor = Colors.getColor('brand-base');

        const fc = `rgb(${fromColor.r}, ${fromColor.g}, ${fromColor.b})`;
        const tc = `rgb(${toColor.r}, ${toColor.g}, ${toColor.b})`;

        this.bgDiv.style.transition = 'initial';
        this.bgDiv.style.backgroundColor = fc;

        setTimeout(() => {
            this.bgDiv.style.transition = 'background-color 2s';
            this.bgDiv.style.backgroundColor = tc;
        }, 25);
    }

    selectComponent() {
        const { item, onSelectAttribute } = this.props;
        if (onSelectAttribute) {
            onSelectAttribute(item.instanceId);
        }
    }

    isLocalAttribute() {
        const { item } = this.props;
        const instanceIds = getInstanceIds(item.instanceId);
        return instanceIds.device === 'local.server';
    }

    // eslint-disable-next-line class-methods-use-this
    renderContent() {
        return null;
    }

    // eslint-disable-next-line class-methods-use-this
    renderChildren() {
        return null;
    }

    renderError() {
        const { item } = this.props;

        const { errorMessage } = item;

        const errorText = errorMessage || '';
        const hideErrorClass = errorText === '' ? 'hide' : '';

        return (
            <div className={`error-label ${hideErrorClass}`}>{errorText}</div>
        );
    }

    renderName() {
        const { item } = this.props;

        const { handle, valueHandle, uuid, name } = item;

        let handleText = '';
        if (handle) {
            handleText = `Handle: 0x${toHexString(handle)}, `;
        } else if (valueHandle) {
            handleText = `Value handle: 0x${toHexString(valueHandle)}, `;
        }

        return (
            <div
                className={`${this.attributeType}-name truncate-text selectable`}
                title={`${handleText}UUID: ${uuid}`}
            >
                {name}
            </div>
        );
    }

    render() {
        const { item, selected, addNew } = this.props;

        const { instanceId, expanded, children } = item;

        const barList = [];

        for (let i = 0; i < this.bars; i += 1) {
            barList.push(<div key={`bar${i + 1}`} className={`bar${i + 1}`} />);
        }

        const content = this.renderContent(null);
        const childrenList = this.getChildren();

        const expandIcon = expanded
            ? 'expand mdi mdi-menu-down'
            : 'expand mdi mdi-menu-right';
        const iconStyle =
            !this.expandable || (children && children.size === 0 && !addNew)
                ? { display: 'none' }
                : {};
        const itemIsSelected = item.instanceId === selected;

        const backgroundClass = itemIsSelected
            ? 'brand-background'
            : 'neutral-background'; // @bar1-color

        const backgroundColor = itemIsSelected
            ? ''
            : `rgb(${Math.floor(this.backgroundColor.r)}, ${Math.floor(
                  this.backgroundColor.g
              )}, ${Math.floor(this.backgroundColor.b)})`;

        return (
            <div>
                <div
                    ref={node => {
                        this.bgDiv = node;
                    }}
                    className={`${this.attributeType}-item ${backgroundClass}`}
                    style={{ backgroundColor }}
                    onClick={this.onContentClick}
                    onKeyDown={() => {}}
                    role="button"
                    tabIndex={0}
                >
                    <div
                        className="expand-area"
                        onClick={this.onExpandAreaClick}
                        onKeyDown={() => {}}
                        role="button"
                        tabIndex={0}
                    >
                        {barList}
                        <div className="icon-wrap">
                            <i
                                className={`icon-slim ${expandIcon}`}
                                style={iconStyle}
                            />
                        </div>
                    </div>
                    <div
                        className="content-wrap"
                        onClick={this.onExpandAreaClick}
                        onKeyDown={() => {}}
                        role="button"
                        tabIndex={0}
                    >
                        {content}
                    </div>
                </div>
                <div style={{ display: expanded ? 'block' : 'none' }}>
                    {childrenList}
                    {addNew && (
                        <AddNewItem
                            key={`add-new-${this.childAttributeType}`}
                            text={`New ${this.childAttributeType}`}
                            id={`add-btn-${instanceId}`}
                            parentInstanceId={instanceId}
                            selected={selected}
                            onClick={this.onAddAttribute}
                            bars={this.bars + 1}
                        />
                    )}
                </div>
            </div>
        );
    }
}

AttributeItem.propTypes = {
    item: PropTypes.oneOfType([
        PropTypes.instanceOf(ImmutableService),
        PropTypes.instanceOf(ImmutableDescriptor),
        PropTypes.instanceOf(ImmutableCharacteristic),
    ]).isRequired,
    selected: PropTypes.string,
    addNew: PropTypes.bool,
    onChange: PropTypes.func,
    onRead: PropTypes.func,
    onWrite: PropTypes.func,
    onSelectAttribute: PropTypes.func,
    onAddCharacteristic: PropTypes.func,
    onAddDescriptor: PropTypes.func,
    onSetAttributeExpanded: PropTypes.func,
};

AttributeItem.defaultProps = {
    selected: null,
    addNew: false,
    onChange: null,
    onRead: null,
    onWrite: null,
    onSelectAttribute: null,
    onAddCharacteristic: null,
    onAddDescriptor: null,
    onSetAttributeExpanded: null,
};

export default AttributeItem;
