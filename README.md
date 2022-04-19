# Build instructions
- From both projects do `npm install` and `npm run build`
- Copy the bundle from ble to launcher `cp pc-nrfconnect-ble/dist/bundle.js pc-nrfconnect-launcher/resources/bundle/`
- Pack and publish launcher with the usual commands `npm run pack` `npm run release`
