<a name="module_auth"></a>

## auth
Authentication workflow for Google Firebase.

**See**: [FirebaseUI for Web](https://github.com/firebase/FirebaseUI-Web)  

* [auth](#module_auth)
    * [initializeFirebase()](#exp_module_auth--initializeFirebase) ⏏
    * [firestore()](#exp_module_auth--firestore) ⇒ <code>Firestore</code> ⏏
    * [userPath()](#exp_module_auth--userPath) ⇒ <code>string</code> ⏏
    * [gcpApi(requestOptions)](#exp_module_auth--gcpApi) ⇒ <code>Promise</code> ⏏
    * [signInNewUser(newUser)](#exp_module_auth--signInNewUser) ⇒ <code>Promise</code> ⏏
    * [startNewSignIn(mainWindow)](#exp_module_auth--startNewSignIn) ⇒ <code>Promise</code> ⏏
    * [getProvider()](#exp_module_auth--getProvider) ⇒ <code>string</code> ⏏
    * [getSignOutUrl(provider)](#exp_module_auth--getSignOutUrl) ⇒ <code>string</code> ⏏
    * [signOutUser()](#exp_module_auth--signOutUser) ⏏
    * [signOutProvider(provider, mainWindow)](#exp_module_auth--signOutProvider) ⇒ <code>BrowserWindow</code> ⏏

<a name="exp_module_auth--initializeFirebase"></a>

### initializeFirebase() ⏏
Must be called before any operations on Firebase API calls.

**Kind**: Exported function  
<a name="exp_module_auth--firestore"></a>

### firestore() ⇒ <code>Firestore</code> ⏏
Firestore is a Google NoSQL datastore. This function returns a reference that can be used with the Firestore API.

**Kind**: Exported function  
**Returns**: <code>Firestore</code> - An interface to Firestore  
**See**: [Firestore](https://firebase.google.com/docs/firestore/)  
<a name="exp_module_auth--userPath"></a>

### userPath() ⇒ <code>string</code> ⏏
Return the unique path prefix for a user.

**Kind**: Exported function  
**Returns**: <code>string</code> - A path string  
<a name="exp_module_auth--gcpApi"></a>

### gcpApi(requestOptions) ⇒ <code>Promise</code> ⏏
Executes an API call to Google Cloud, taking care of user authentication and token refresh.

**Kind**: Exported function  
**Returns**: <code>Promise</code> - Promise object represents the payload response of the API call (string|object|buffer)  
**See**: [Request Options](https://github.com/request/request#requestoptions-callback)  

| Param | Type | Description |
| --- | --- | --- |
| requestOptions |  | A set of option parameters for the API request |
| requestOptions.url | <code>string</code> \| <code>object</code> | HTTP(S) endpoint to call, string or object in the format of url.parse() |
| requestOptions.method | <code>string</code> | HTTP verb, e.g. GET, POST, etc. |
| requestOptions.headers | <code>object</code> | An object with any additional request headers |

<a name="exp_module_auth--signInNewUser"></a>

### signInNewUser(newUser) ⇒ <code>Promise</code> ⏏
Completes the authentication workflow for a new user. The user credential will be saved in as a web browser identity persistence so it can be recovered on a subsequent session without forcing the user to log in again.

**Kind**: Exported function  
**Returns**: <code>Promise</code> - A Promise object representing the user object  

| Param | Type | Description |
| --- | --- | --- |
| newUser | <code>object</code> | This is an object passed from the Web UI for authentication after a successful registration of a new user |

<a name="exp_module_auth--startNewSignIn"></a>

### startNewSignIn(mainWindow) ⇒ <code>Promise</code> ⏏
Initiates the Firebase UI authentication workflow. nodeIntegration must be set to false because it wouldexpose the login page to hacking through the IPC interface.

**Kind**: Exported function  
**Returns**: <code>Promise</code> - A Promise object representing the new modal window for authentication workflow  

| Param | Type | Description |
| --- | --- | --- |
| mainWindow | <code>BrowserWindow</code> | The parent (or main) window, so that the workflow window can be modal |

<a name="exp_module_auth--getProvider"></a>

### getProvider() ⇒ <code>string</code> ⏏
Gets the identity provider that was used to authenticate the current user.

**Kind**: Exported function  
**Returns**: <code>string</code> - The firebase representation of the identity provider, can be any of:             "google.com","github.com","twitter.com","facebook.com","password","phone"  
<a name="exp_module_auth--getSignOutUrl"></a>

### getSignOutUrl(provider) ⇒ <code>string</code> ⏏
Firebase UI doesn't have a workflow for logging out from the identity provider, so this functionreturns a URL that can be used to log out directly -- if the identity provider doesn't change the URL.

**Kind**: Exported function  
**Returns**: <code>string</code> - A URL that can be called to log out of the identity provider  

| Param | Type | Description |
| --- | --- | --- |
| provider | <code>string</code> | The name of the identity provider, from getProvider() |

<a name="exp_module_auth--signOutUser"></a>

### signOutUser() ⏏
Logs out the user from Firebase, but not from the identity provider.

**Kind**: Exported function  
<a name="exp_module_auth--signOutProvider"></a>

### signOutProvider(provider, mainWindow) ⇒ <code>BrowserWindow</code> ⏏
Performs a complete signout from Firebase and the identity provider.

**Kind**: Exported function  
**Returns**: <code>BrowserWindow</code> - A new window that was used for the identity provider logout  

| Param | Type | Description |
| --- | --- | --- |
| provider | <code>string</code> | The identity provider, from getProvider() |
| mainWindow | <code>BrowserWindow</code> | A parent window, so the logout window can be modal |

