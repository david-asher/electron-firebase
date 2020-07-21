// weblocal.js
// this is not a module, but is included in other HTML pages
// provides an interface to web localStorage

// communication between Main and Renderer processes
var ipc = require('electron').ipcRenderer

// implements the browser interface to localstorage.js
ipc.on( 'localStorage', ( event, command, key, value ) => 
{
  switch( command ) {
    case "setItem": 
        localStorage.setItem( key, value )
        break
    case "removeItem": 
        localStorage.removeItem( key )
        break
    case "getItem": 
        ipc.send( 'localStorage:' + key, localStorage.getItem( key ) ) 
        break
    }
})

function askMain( topic, request, ...parameters )
{
  return new Promise( (resolve, reject) => {
    ipc.once( topic, ( event, response ) => {
      resolve( response )
    })
    ipc.send( topic, request, parameters[0], parameters[1], parameters[2]  )
  })
}

ipc.send( 'about-browser', {
    language: navigator.language,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    dateFormat: Intl.DateTimeFormat().resolvedOptions(),
    numberFormat: Intl.NumberFormat().resolvedOptions(),
    startUTC: (new Date()).toUTCString(),
    started: Date.now().toString(),
    online: navigator.onLine
})
