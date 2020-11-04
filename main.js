const { Menu } = require('electron')
const platform = require('os').platform()
const menubar = require('menubar')

// Toggle with cmd + alt + i
require('electron-debug')({showDevTools: true})

const initialIcon = `${__dirname}/img/png/blank.png`

const mb = menubar({
  width: 220,
  height: 206,
  preloadWindow: true,
  icon: initialIcon
})

// Make menubar accessible to the renderer
global.sharedObject = { mb }

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
  mb.window.loadURL(`file://${__dirname}/index.html`)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Change Timer',
      submenu: [
        { label: '25/5',
          type: 'radio',
          checked: true,
          click: () => mb.window.webContents.send('CHANGE_TIMER', '25/5')
        },
        { label: '42/18',
          type: 'radio',
          checked: false,
          click: () => mb.window.webContents.send('CHANGE_TIMER', '42/18')
        },
        { label: '60/15',
          type: 'radio',
          checked: false,
          click: () => mb.window.webContents.send('CHANGE_TIMER', '60/15')
        },
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
