// weblogin.js
// this is not a module, but is included in the loginstart.html page

// These specify the local storage location for persistent user credentials,
// which we can use to determine if there is a persistent credential that is
// used for auto-login. 
const fbDatabaseName    = "firebaseLocalStorageDb"
const fbStorageName     = "firebaseLocalStorage"
const fbStoredUserKey   = "firebase:authUser"

const queryParams = new URLSearchParams( location.search )

function getQueryParam( paramName )
{
   return queryParams.get( paramName )
}

function getTrueQueryParam( paramName )
{
    const value = queryParams.get( paramName ) || ""
    return ( value === true ) || ( value.toLowerCase() === 'true' )
}

function openObjectStore( dataStoreName, dataObjectName, openMode )
{
    var dbReq, fbdb, transaction
    return new Promise( (resolve, reject) => 
    {
        dbReq = indexedDB.open( dataStoreName, 1 )
        dbReq.onerror = (error) => {
            reject( "openObjectStore ERROR opening database, ", error )
        }
        dbReq.onsuccess = (event) => {
            fbdb = event.target.result
            transaction = fbdb.transaction( dataObjectName, openMode || "readonly" )
            transaction.onerror = (error) => {
                reject( "openObjectStore transaction ERROR, ", error )
            }
            resolve( transaction.objectStore( dataObjectName ) )
        }
    })
}

function findKeyInStore( dbStore, dbKeyName )
{
    var keyReq, keyList, foundKey
    return new Promise( (resolve, reject) => 
    {
        keyReq = dbStore.getAllKeys()
        keyReq.onerror = (error) => {
            reject( "findKeyInStore ERROR getting all keys, ", error )
        }
        keyReq.onsuccess = (event) => {
            keyList = event.target.result
            foundKey = keyList.find( (element, index) => {
                return ( element.indexOf( dbKeyName ) == 0 )
            })
            if ( !foundKey ) {
                return reject( "findKeyInStore: NO KEY" )
            }
            resolve( foundKey )
        }
    })
}

function getObjectFromStore( dbStore, dbKeyName )
{
    var keyValueReq
    return new Promise( (resolve, reject) => 
    {
        findKeyInStore( dbStore, dbKeyName )
        .then( (foundKey) => {
            keyValueReq = dbStore.get( foundKey )
            keyValueReq.onerror = (error) => {
                reject( "getObjectFromStore ERROR getting value, ", error )
            }
            keyValueReq.onsuccess = (event) => {
                resolve( event.target.result )
            }
        })
        .catch( (error) => {
            reject( "getObjectFromStore ERROR finding key, ", error )
        })
    })
}

function deleteObjectFromStore( dbStore, dbKeyName )
{
    var keyValueReq
    return new Promise( (resolve, reject) => 
    {
        findKeyInStore( dbStore, dbKeyName )
        .then( (foundKey) => {
            keyValueReq = dbStore.delete( foundKey )
            keyValueReq.onerror = (error) => {
                reject( "deleteObjectFromStore ERROR deleting key, ", error )
            }
            keyValueReq.onsuccess = (event) => {
                resolve( "user deleted" )
            }
        })
        .catch( (error) => {
            reject( "deleteObjectFromStore ERROR finding key, ", error )
        })
    })
}

function postAuthResult( authResult )
{
    // authResult is https://firebase.google.com/docs/reference/js/firebase.auth#.UserCredential
    // the user's credentials get sent back to Main process via API
    const appUpdate = {
        user: firebase.auth().currentUser.toJSON(),
        operationType: authResult.operationType || null,
        additionalUserInfo: authResult.additionalUserInfo,
        refreshToken: authResult.refreshToken || authResult.user.refreshToken,
        credential: authResult.credential || null
    }
    return api( 'POST', getQueryParam( "logintoken" ), appUpdate )
    .then( (status) => {
        // redirect to the login complete page which should close this window
        window.location.assign( getQueryParam( "loginRedirect" ) )
    })
    .catch( (error) => {
        alert( "ERROR in sign-in process, please restart this application: ", stringifyJSON(error) )
        window.close()
    })
}

async function showLoginWindow()
{
    var responseCode = null

    await api( 'GET', getQueryParam( "loginready" ), null )
    .then( (response) => {
        responseCode = response.status
    })
    .catch( (error ) => {
        console.error( "showLoginWindow ERROR: ", error )
    })
    return responseCode
}

function firebaseAuthUIStart( fbConfig, idpConfig ) 
{
    var uiConfig = {
        callbacks: {
            signInSuccessWithAuthResult: ( authResult, redirectUrl ) => {
                // send the authentication event and result back to the main app
                postAuthResult( authResult )
                // return false to prevent redirection
                return false
            },
            signInFailure: ( error, credential ) => {
                alert( "Sign in failure: " + error + ". Please restart the app" )
                window.close()
            },
            uiShown: () => {
                // The widget is rendered. Hide the loader.
                document.getElementById('loader').style.display = 'none';
            }
        },
        signInOptions: [
            // fill this in dynamically based on configuration
        ],
        // see: https://github.com/firebase/firebaseui-web#credential-helper
        credentialHelper: firebaseui.auth.CredentialHelper.ACCOUNT_CHOOSER_COM,           
        // tosUrl and privacyPolicyUrl accept either url string or a callback function.
        tosUrl: fbConfig.tosUrl,
        privacyPolicyUrl: fbConfig.privacyUrl
    }

    // Initialize the FirebaseUI Widget
    // set up the configuration for each identity provider that was specified in uiConfig
    fbConfig.providers.forEach( ( provider ) => {
        uiConfig.signInOptions.push( idpConfig[ provider ] )
    })
    var ui = new firebaseui.auth.AuthUI( firebase.auth() )
    ui.start('#firebaseui-auth-container', uiConfig)
}

async function checkForPersistentUser()
{
    try {
        const dbStore = await openObjectStore( fbDatabaseName, fbStorageName )
        return await getObjectFromStore( dbStore, fbStoredUserKey )
    }
    catch (error) {
        throw( "checkForPersistentUser ERROR, ", error )
    }
}

async function setUserPersistence( allowPersistence )
{
    var persistence = firebase.auth.Auth.Persistence.NONE
    
    switch ( allowPersistence ) {
    case false:
    case 'false':
    case 'SESSION':
    case 'session':
        persistence = firebase.auth.Auth.Persistence.SESSION
        break;
    case true:
    case 'true':
    case 'LOCAL':
    case 'local':
        persistence = firebase.auth.Auth.Persistence.LOCAL
        break;
    }
    await firebase.auth().setPersistence( persistence )
}

async function checkForSignout()
{
    try {
        // normal case is no signout, just leave
        if ( !getTrueQueryParam( "signoutuser" ) ) return true
        // signout, clear persistence and signout from firebase
        setUserPersistence( 'none' )
        return firebase.auth().signOut()
    }
    catch (error) {
        alert( "Error in signout process: ", error )
        throw( error )
    }
}
