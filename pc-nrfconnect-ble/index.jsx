/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect } from 'react';
import { App, getUserDataDir } from 'pc-nrfconnect-shared';

import DocumentationSections from './lib/components/DocumentationSection';
import SidePanel from './lib/components/SidePanel';
import BLEEventDialog from './lib/containers/BLEEventDialog';
import DeviceDetails from './lib/containers/DeviceDetails';
import DeviceSelector from './lib/containers/DeviceSelector';
import ServerSetup from './lib/containers/ServerSetup';
import reducers from './lib/reducers';
import {
    confirmUserUUIDsExist,
    migrateOldPersistentStorage,
    populateUuids,
} from './lib/utils/uuid_definitions';

import './resources/css/styles.scss';

migrateOldPersistentStorage(getUserDataDir());

export default () => {
    useEffect(() => {
        confirmUserUUIDsExist(getUserDataDir());
        populateUuids();
    }, []);

    return (
        <App
            appReducer={reducers}
            deviceSelect={<DeviceSelector />}
            sidePanel={<SidePanel />}
            panes={[
                { name: 'Connection Map', Main: DeviceDetails },
                { name: 'Server Setup', Main: ServerSetup },
            ]}
            documentation={DocumentationSections}
        >
            <BLEEventDialog />
        </App>
    );
};
