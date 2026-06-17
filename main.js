const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Programas Rabanales",
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, 'public/favicon.ico'), // Opcional: si tienes un icono
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // ¡AQUÍ VA TU ENLACE DE VERCEL! 👇
  win.loadURL('https://programas-rabanales.vercel.app'); 

  win.setMenuBarVisibility(false); // Oculta el menú clásico de Windows
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});