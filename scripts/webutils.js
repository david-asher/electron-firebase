// webutils.js
// this is not a module, but is included in other HTML pages

function isJSON( s ) 
{
    return ( typeof s == 'string' ) && ( s.charAt(0) == '{' || s.charAt(0) == '[' );
}

function isObject( obj )
{
    return obj && typeof obj == 'object'
}

function parseJSON( jString ) 
{
    if( jString == null ) return null
    if ( !isJSON( jString ) ) {
        return jString
    }
    try {
        return JSON.parse( jString )
    }
    catch (err) {
        console.error( "ERROR parsing JSON: ", err, jString )
        return null
    }
}

function stringifyJSON( thisObject ) 
{
    if ( thisObject == null ) return null
    if ( typeof thisObject !== 'object' && !Array.isArray( thisObject ) ) {
        return thisObject
    }
    try {
        return JSON.stringify( thisObject );
    }
    catch (err) {
        console.error( "ERROR stringifying JSON: ", err )
        return null
    }
}

function api( method, url, payload ) 
{
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open( method , url );
        if ( isJSON( payload ) || isObject( payload ) ) {
            xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
        }
        xhr.onreadystatechange = function() {
            // readyState 4 is DONE
            if ( xhr.readyState !== 4 ) return
            if ( xhr.status >= 300 ) {
                console.error( "ERROR in api: ", method, url, xhr.status, xhr.response )
                reject( {error: "API ERROR", url: url, payload: payload, status: xhr.status } )
                return
            }
            resolve( parseJSON( xhr.response ) )
        }
        xhr.send( stringifyJSON( payload ) );
    })
}
