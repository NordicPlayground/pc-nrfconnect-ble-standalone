# Release instructions
- Check that the versions are correct
  - `pc-nrfconnect-launcher/package.json`
  - `pc-nrfconnect-launcher/resources/bundle/package.json`
  - `pc-nrfconnect-ble/package.json`
  - In the proxy app `src/config.ts`
- In the launcher: `npm install`
- Then `npm run pack` to create the installer
- Copy installer from release folder to github

# Updating the BLE app
- Make changes in the ble app 
- Build with `npm run build`
- Copy the bundle from ble to launcher `cp pc-nrfconnect-ble/dist/bundle.js pc-nrfconnect-launcher/resources/bundle/`
