// webmodal.js
// this is not a module, but is included in the index.html page
// functions for formatting data returned from info-buttons requests

function isImagePath(url) 
{
    if ( typeof url !== 'string' ) return false
    return null != url.match( /\.(jpeg|jpg|gif|png)$/, 'i' )
}

function isURL( whatever )
{
    if ( typeof whatever !== 'string' ) return false
    return null != whatever.match( /^(http|https):\/\//, 'i' )
}

function isTag( whatever )
{
    if ( typeof whatever !== 'string' ) return false
    return ( whatever.charAt(0) == '<' && whatever.charAt(whatever.length-1) == '>' )
}

function makeImageElement( url )
{
    return $(`<img src="${url}" alt="${url}" height="128" >`)
}

function makeJsonElement( arg )
{
    var pretext = $('<pre>')
    pretext.text( JSON.stringify( arg, null, 4 ) )
    return pretext
}

function makeBasicElement( arg )
{
    return String( arg )
}

function createTableRow( table, ...args )
{
    var row = $('<tr>')
    table.append(row) 
    for (let arg of args) {
        var cell = $('<td>')
        row.append(cell)
        // make a formatting decision based on the content of this arg
        if ( isTag(arg) )                 cell.append( $(arg) )
        else if ( $.isPlainObject(arg) )  cell.append( makeJsonElement(arg) )
        else if ( isURL(arg) )            cell.append( makeImageElement(arg) )
        else                              cell.text( makeBasicElement( arg ) )
    }
}

async function setModalContent( table, request, parameter )
{
    // send the info-request back to the main app, and 
    // stuff each response into a table row
    const response = await askMain( 'info-request', request, parameter )
    Object.entries(response).forEach( ([key,value]) => {
        createTableRow( table, key, value )
    })
    return response
}
