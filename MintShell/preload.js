const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al proceso de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
  // Ejemplo: enviar mensaje al proceso principal
  sendMessage: (message) => ipcRenderer.send('message', message),
  
  // Ejemplo: recibir respuesta
  onReply: (callback) => ipcRenderer.on('reply', callback)
});
