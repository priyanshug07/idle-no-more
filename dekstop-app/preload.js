const { contextBridge } = require('electron');
const os = require('os');
const { networkInterfaces } = require('os');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'systemInfo', {
        getMacAddress: () => {
            const interfaces = networkInterfaces();
            for (const name of Object.keys(interfaces)) {
                for (const interface of interfaces[name]) {
                    // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
                    if (interface.family === 'IPv4' && !interface.internal) {
                        return interface.mac;
                    }
                }
            }
            return null;
        },
        getIpAddress: () => {
            const interfaces = networkInterfaces();
            for (const name of Object.keys(interfaces)) {
                for (const interface of interfaces[name]) {
                    // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
                    if (interface.family === 'IPv4' && !interface.internal) {
                        return interface.address;
                    }
                }
            }
            return null;
        },
        getSystemInfo: () => {
            return {
                platform: os.platform(),
                release: os.release(),
                arch: os.arch(),
                hostname: os.hostname(),
                userInfo: os.userInfo()
            };
        }
    }
); 