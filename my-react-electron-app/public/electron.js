const { app, BrowserWindow } = require('electron');

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false  // Depending on Electron version, adjust appropriately
        }
    });

    // and load the index.html of the app.
    // Change the URL to where your React app is served from, typically localhost:3000 when started with npm start
    mainWindow.loadURL('http://localhost:3000');

    // Open the DevTools. - This line can be commented out if you don't want the dev tools to open automatically
    mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
