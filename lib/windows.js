/* windows.js
 * Copyright (c) 2019-2020 by David Asher, https://github.com/david-asher
 */
'use strict';

/**
 * This module will open and manage Electron BrowserWindow instances.
 * @module window
 */

const url = require('url')
const { ipcMain, BrowserWindow } = require('electron')
const applib = require( './applibrary' )
const local = require( './localstorage' )

/**
 * Opens a BrowserWindow.
 * @see {@link https://electronjs.org/docs/api/browser-window|Electron BrowserWindow}
 * @alias module:window
 */
class open extends BrowserWindow
{
    /**
     * Create a window.open object. The window will automatically track window changes in size and 
     * position and keep the bounds changes in localStorage.
     * @param {string} urlToOpen - Opens the window and loads this page
     * @param {options} [setOptions] - A set of options for changing the window properties
     * @returns {Promise<WindowObject>} An WindowObject inhereted from BrowserWindow
     * @see {@link https://electronjs.org/docs/api/browser-window|BrowserWindow options}
     */
    constructor( urlToOpen, setOptions, urlOptions )
    {
        var urlParts
        try {
            urlParts = url.parse( urlToOpen )
        }
        catch (error) {
            console.error( "ERROR on open: ", urlToOpen, error )
            return null
        }
        // nodeIntegration: open a safe window that can't connect to the Main process if URL is not localhost
        const baseOptions = {
            show: false,
            resizable: true,
            movable: true,
            webPreferences: {
                nodeIntegration: ( "localhost" == urlParts.hostname ) 
            }
        }
        const openOptions = applib.mergeObjects( baseOptions, setOptions || {} );

        // open the BrowserWindow
        super( openOptions )
    
        // setup the chrome debug tools as requested in the app config
        if ( global.appConfig.debugMode ) super.webContents.openDevTools()
    
        // automatic persistence of window move and resize events
        this.boundsCheckerEnabled = openOptions.resizable || openOptions.movable
        if ( this.boundsCheckerEnabled ) this._setupBoundsChecker( openOptions.title )

        // now that the window is configured, open it with the URL
        super.loadURL( urlToOpen, urlOptions )
    }

    /**
     * Why is this function here? If you create a new window.open object and pass that 
     * to dialog.showMessageBox() for a modal doalog, it won't render the dialog content
     * (i.e. it's a blank dialog). Even when you capture the constructor super(), the call
     * to showMessageBox() still comes up blank. This method returns an actual
     * BrowserWindow object that is satisfactory for building a modal dialog.
     */
    window()
    {
        return BrowserWindow.fromId( super.id )
    }

    /**
     * If you open the window with option show:false then call window.show(), use this function
     * to get a Promise that returns after the window is visible.
     * @returns {Promise<void>}
     */
    waitForShow() 
    {
        return new Promise( ( resolve, reject ) =>
        {
            // super.id is a test to make sure the window still exists
            try {
                const bad = super.id
            }
            catch (error) {
                return resolve( true )
            }
            if ( super.isVisible() ) {
                return resolve( true )
            }
            super.once( 'ready-to-show', () => {
                return resolve( true )
            })
        })
    }

    /**
     * If you close the window with window.close(), use this function
     * to get a Promise that returns after the window is destroyed.
     * @returns {Promise<void>}
     */
    waitForClose() 
    {
        return new Promise( ( resolve, reject ) =>
        {
            // super.id is a test to make sure the window still exists
            try {
                const bad = super.id
            }
            catch (error) {
                return resolve( true )
            }
            if ( super.isDestroyed() ) {
                return resolve( true )
            }
            super.once( 'closed', () => {
                return resolve( true )
            })
        })
    }

    _updateBounds()
    {
        var current = Date.now()
        if ( this.boundsTimer ) clearTimeout( this.boundsTimer )
        if ( this.lastMove == null || current - this.lastMove < 500 ) {
            this.boundsTimer = setTimeout( this._updateBounds, 500 )
            this.lastMove = current
            return
        }
        var bounds = super.getBounds()
        local.setItem( this.boundsKey, bounds )
        this.lastMove = null
    }

    /**
     * Recalls the last saved position and shape of the window, particularly useful for the first showing of the window.
     * @returns {object} Returns the previous bounds object that the window will now be set to
     */
    resize( callback )
    {
        var updatedBounds = null
        if ( !this.boundsCheckerEnabled ) {
            if ( callback ) callback( null )
            return 
        }
        local.getItem( this.boundsKey )
        .then( ( bounds ) => {
            updatedBounds = bounds
            if ( bounds ) {
                super.setBounds( updatedBounds )    
            }
            if ( callback ) callback( updatedBounds )
        })
        .catch( (error) => {
            if ( callback ) callback( null )
        })
    }

    _setupBoundsChecker( title )
    {
        this.boundsTimer = null
        this.lastMove = null
        this._updateBounds = this._updateBounds.bind( this )
        this.boundsKey = title ? "bounds:" + title.replace( /\W/g, "" ) : null
        super.on( 'resize', this._updateBounds )
        super.on( 'move', this._updateBounds ) 
        this.boundsCheckerEnabled = true
    }

    /**
     * Sends a message - a payload on a specific channel - to the BrowserWindow
     * @param {string} channel - A topic which the BrowserWindow should be expecting
     * @param {string|number|object|array} payload - The message content to send on the topic
     * @see {@link https://electronjs.org/docs/api/web-contents#contentssendchannel-arg1-arg2-|BrowserWindow.webContents.send()}
     */
    send( channel, payload )
    {
        if ( !super.webContents ) return
        super.webContents.send( channel, payload )
    }

    /**
     * Receives a message event from the BrowserWindow, with optional callback or Promise interface. The callback
     * or Promise will fire whenever a message event is received on the channel.
     * @param {string} channel - A topic which the BrowserWindow should be expecting
     * @param {function} [callback] - Optional callback function to receive the message event 
     * @returns {Promise<string|number|object|array>} If no callback is supplied then a Promise is returned
     * @see {@link https://electronjs.org/docs/api/web-contents#contentssendchannel-arg1-arg2-|BrowserWindow.webContents.send()}
     */
    receive( channel, callback )
    {
        if ( callback ) {
            ipcMain.on( channel, (event,...args) => {
                callback.apply( this, args )
            })
            return
        }
        return new Promise( (resolve,reject) => {
            ipcMain.on( channel, (event,...args) => {
                resolve.apply( this, args )
            })
        })
    }

    /**
     * Close the window.
     */
    close()
    {
        if ( this.boundsTimer ) clearTimeout( this.boundsTimer )
        super.off( 'resize', this._updateBounds )
        super.off( 'move', this._updateBounds ) 
        super.close()
    }
}

/**
 * Similar to window.open() except a modal window is created as a child to the parentWindow.
 * @param {string} urlToOpen - Opens the window and loads this page
 * @param {BrowserWindow} parentWindow - A BrowserWindow which will contain the model window
 * @param {options} setOptions - A set of options for changing the window properties
 * @returns {Promise<WindowObject>} An WindowObject inhereted from BrowserWindow
 * @see {@link https://electronjs.org/docs/api/browser-window|BrowserWindow options}
 */
function openModal( urlToOpen, parentWindow, setOptions, urlOptions ) 
{
    const baseOptions =  {
        parent: parentWindow, 
        modal: true, 
        show: true,
        alwaysOnTop: true,
        frame: false,
    }
    const openOptions = applib.mergeObjects( baseOptions, setOptions || {} );
    // this may look strange to call a new window "open", but the method is 
    // usually called from the outside using this library, e.g. require('windows.js').open
    return new open( urlToOpen, openOptions, urlOptions )
}

module.exports = {
    open: open,
    openModal: openModal
}
