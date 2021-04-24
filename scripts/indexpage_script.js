// indexpage_script.js
// functions for interacting with main app, note that ipc is defined in weblocal.js

function signout() 
{
    // send the signout signal back to Main
    ipc.send( 'user-signout', Date.now().toString() ) 
}

// custom elements
class InfoButton extends HTMLButtonElement {
  constructor() {
    super()
    this.setAttribute('class', 'btn btn-info')
    this.setAttribute('type', 'button')
    this.setAttribute('data-toggle', 'modal')
    this.setAttribute('data-target', '#ModalDialog')
  }
}
customElements.define('info-button', InfoButton, {extends: 'button'});

function showSpinner( parent, bShowState )
{
  const spinner = parent.find('.spinner-border')
  switch( bShowState ) {
    case true: spinner.removeClass("invisible")
      break;
    case false: spinner.addClass("invisible")
      break;
    case "show": spinner.removeClass("d-none")
      break;
    case "hide": spinner.addClass("d-none")
      break;
  }
}

function insertSpinner( parent, bShowState )
{
  const spinner = parent.find('.spinner-border')
  if ( bShowState ) spinner.removeClass("d-none")
  else spinner.addClass("d-none")
}

function createNavLink( navColumn, link )
{
  const anchor = $('<a class="nav-link">') // text-info
  anchor.attr( "data-toggle", "tab" )
  anchor.attr( "role", "pill" )
  anchor.attr( "aria-controls", "v-pills-profile" )
  anchor.attr( 'href', '#folder-list-anchor' )
  anchor.attr( "data-link", link )
  anchor.text( link )
  anchor.prepend( $('<i class="fa fa-fw fa-lg fa-folder mr-1 ">') )
  navColumn.append( anchor )
}

async function setFolderList()
{
  // ask the main app for the folder list
  // put each folder into a nav column of links
  const domain = $("#file-domain").find("button.active").val()
  const navColumn = $("#nav-folder-links")
  navColumn.find(".nav-link").remove()
  insertSpinner( navColumn, true )

  // request back to main for the folder list
  const response = await askMain( "info-request", "folder-list", domain )
  insertSpinner( navColumn, false )
  await response.forEach( (element) => {
    createNavLink( navColumn, element )
  })
  return response
}

function displayDate( fileISOString )
{
  const fileDate = new Date( fileISOString )
  var showDate = fileDate.toLocaleDateString( undefined, displayDate.doptions )
  if ( showDate == (new Date()).toLocaleDateString( undefined, displayDate.doptions ) ) {
    showDate = fileDate.toLocaleTimeString()
  }
  return showDate
}

displayDate.doptions = {
  day: "2-digit",
  month: "short",
  year: "numeric"
}

function imageLink( iconClass, url, mime )
{
  const link = `<a class="fa fa-fw fa-lg fa-${iconClass} mr-1" href="#" data-url="${url}" data-content="${mime}">`
  return link
}

function setFileList( fileList )
{
  var tableBody = setFileList.fileTable.find('.tableBody')
  tableBody.empty()
  fileList.forEach( (element) => {
    createTableRow( tableBody, 
      element.name, 
      displayDate(element.updated), 
      element.size,
      imageLink( "file-text", element.path ),
      imageLink( "cloud-download", element.downloadUrl, element.contentType ) )
  })
}

document.onreadystatechange = function () 
{
  if ( document.readyState !== 'complete' ) return

  $('#file-domain button').on('click', function() {
    var thisBtn = $(this);
    thisBtn.addClass('active').siblings().removeClass('active');
    setFolderList()
  });

  $('#nav-folder-links').click( (event) =>
  {
    setFileList.filesDiv = $("#nav-folder-files")
    setFileList.fileTable = setFileList.filesDiv.find( ".table" )
    setFileList.fileTable.addClass("invisible")
    showSpinner( setFileList.filesDiv, "show" )
    const anchor = $(event.target)
    const panel = $(this)

    // request back to main for the file list
    askMain( "info-request", "file-list", anchor.data('link'), $("#file-domain").find("button.active").val() )
    .then( setFileList )
    .finally( () => {
      setFileList.fileTable.removeClass("invisible")
      showSpinner( setFileList.filesDiv, "hide" )
    })
  })

  // trigger any class=btn-user-action button basedon its value parameter
  $('.btn-user-action').on('click', function() 
  {
    switch( $(this).val() ) {
      case 'signout': 
        signout() 
        break
    }
  });

  $(document).on( "click", "a.fa-file-text", async (event) =>
  {
    const target = $(event.target)
    const url = target.data("url") 
    const modal = $("#ModalDialog")
    const card = $('<div class="card-body">') 
    modal.modal('show')
    modal.find('.modal-title').text( url )

    // request back to main for the file content
    const response = await askMain( "show-file", "path", url )
    card.append( makeJsonElement(response) )
    modal.find('.modal-body').append(card)
    showSpinner( modal, false )
  })

  $(document).on( "click", "a.fa-cloud-download", (event) =>
  {
    const anchor = $(event.target)
    const url = anchor.data("url") 
    const mime = anchor.data("content")

    // request back to main for the file content
    askMain( "show-file", "url", url, mime )
  })

  $('#ModalDialog').on('show.bs.modal', async (event) =>
  {
    // The modal dialog is about to open, but it's generic.
    // So we need to set its title, and build a table with the right content.
    const button = $(event.relatedTarget)
    const modal = $("#ModalDialog")
    modal.find('.modal-title').text( button.text() )
    var table = $('<table class="table">') 
    modal.find('.modal-body').append(table)
    await setModalContent( table, button.data('set'), button.data('ask') )
    showSpinner( modal, false )
  })

  $('#ModalDialog').on('hidden.bs.modal', (event) =>
  {
    const modal = $("#ModalDialog")
    modal.find('.table').remove()
    modal.find('.card-body').remove()
    showSpinner( modal, true )
  })

  $('#ModalDialogAccept').on('click', function (event) 
  {
    var button = $(event.relatedTarget) // Button that triggered the modal
    // do whatever you want after the user accepts OK
  })

  ipc.on( 'app-ready', () => 
  {
      // hide the opening spinner and show the contents
      $("#main-window-loading").addClass("d-none")
      $("#main-window-content").removeClass("d-none")

      // populate the folder list
      setFolderList()
  })
}
