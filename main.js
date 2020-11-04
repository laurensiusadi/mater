const {Menu} = require('electron')
const platform = require('os').platform()
const {menubar} = require('menubar')
const path = require('path')

// Toggle with cmd + alt + i
require('electron-debug')({showDevTools: true})

const initialIcon = path.join(__dirname, 'img', 'png', 'blank.png')

const mb = menubar({
  preloadWindow: true,
  icon: initialIcon,
  browserWindow: {
    width: 220,
    height: 206,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  }
})

// Make menubar accessible to the renderer
global.sharedObject = {mb}

mb.on('ready', () => {
  console.log('app is ready')
  // Workaround to fix window position when statusbar at top for win32
  if (platform === 'win32') {
    if (mb.tray.getBounds().y < 5) {
      mb.setOption('windowPosition', 'trayCenter')
    }
  }
})

mb.on('after-create-window', () => {
  mb.window.loadURL(path.join(__dirname, 'index.html'))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Change Timer',
      submenu: [
        {
          label: '25/5',
          type: 'radio',
          checked: true,
          click: () => mb.window.webContents.send('CHANGE_TIMER', '25/5')
        },
        {
          label: '45/15',
          type: 'radio',
          checked: false,
          click: () => mb.window.webContents.send('CHANGE_TIMER', '45/15')
        },
        {
          label: '60/20',
          type: 'radio',
          checked: false,
          click: () => mb.window.webContents.send('CHANGE_TIMER', '60/20')
        }
      ]
    },
    {
      label: 'Sound Effect',
      submenu: [
        {
          label: 'On',
          type: 'radio',
          checked: true,
          click: () => mb.window.webContents.send('TOGGLE_SOUND', true)
        },
        {
          label: 'Off',
          type: 'radio',
          checked: false,
          click: () => mb.window.webContents.send('TOGGLE_SOUND', false)
        }
      ]
    },
    {
      label: 'Quit',
      click: () => {
        mb.app.quit()
      }
    }
  ])
  mb.tray.on('right-click', () => {
    mb.tray.popUpContextMenu(contextMenu)
  })
})
