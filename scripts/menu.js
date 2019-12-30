// fixed up these references!!!
var remote = require('electron').remote
var Menu = require('electron').remote.Menu
var MenuItem = require('electron').remote.MenuItem

// Build our new menu
var menu = new Menu()
menu.append(new MenuItem({
  label: 'Delete',
  click: function() {
    // Trigger an alert when menu item is clicked
    alert('Deleted')
  }
}))
menu.append(new MenuItem({
  label: 'More Info...',
  click: function() {
    // Trigger an alert when menu item is clicked
    alert('Here is more information')
  }
}))

// Add the listener
document.addEventListener('DOMContentLoaded', function () {
    var contextMenu = document.querySelector('.js-context-menu')
    if ( !contextMenu ) return
    contextMenu.addEventListener('click', function (event) {
      menu.popup(remote.getCurrentWindow());
    })
})
