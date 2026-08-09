/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { DocumentationSection } from 'pc-nrfconnect-shared';

const DocumentationSections = [
    <DocumentationSection
        key="getting-started"
        linkLabel="Getting Started Guide"
        link="https://infocenter.nordicsemi.com/topic/ug_nrfconnect_ble/UG/nRF_Connect_BLE/nRF_Connect_intro.html"
    >
        Learn the basics of connecting your Nordic development kit to your PC and getting started with Bluetooth Low Energy development.
    </DocumentationSection>,
    <DocumentationSection
        key="device-connection"
        linkLabel="Connection Requirements"
        link="https://infocenter.nordicsemi.com/topic/ug_nrfconnect_ble/UG/nRF_Connect_BLE/nRF_Connect_hardware_setup.html"
    >
        To connect a Nordic device: Use a USB cable to attach your nRF51, nRF52, nRF53, or nRF91 development kit to your PC. Ensure the device is properly recognized in the Device Selector.
    </DocumentationSection>,
    <DocumentationSection
        key="prerequisites"
        linkLabel="Platform Prerequisites"
        link="https://infocenter.nordicsemi.com/topic/ug_nrfconnect/UG/nRF_Connect_for_desktop/nRF_Connect_instalation.html"
    >
        macOS and Linux require the J-Link driver from SEGGER. Linux also requires udev rules for USB access. Windows users can typically connect directly after USB drivers are recognized.
    </DocumentationSection>,
    <DocumentationSection
        key="infocenter"
        linkLabel="Full App Documentation"
        link="https://infocenter.nordicsemi.com/topic/ug_nrfconnect_ble/UG/nRF_Connect_BLE/nRF_Connect_intro.html"
    >
        Visit our Infocenter for comprehensive documentation about using the nRF Connect BLE app.
    </DocumentationSection>,
];

export default DocumentationSections;
