/* answerBrowser.js
 * electron-firebase
 * This is a quickstart template for building Firebase authentication workflow into an electron app
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 * 

'use strict';

/*
 * This module contains functions that respond to queries from the Browser
 * @module answerBrowser
 */

const { data } = require( '../electron-firebase' )

function buildProfile( user )
{
    return {
        "Name": user.displayName,
        "Email": user.email,
        "User ID": user.uid,
        "Photo:": user.photoURL,
        "Last Login": (new Date( parseInt(user.lastLoginAt,10) )).toString()
    }
}

function getUser( parameter )
{
    switch( parameter )
    {
        case 'profile':  return buildProfile( global.user )
        case 'provider': return global.user.providerData[0]
        case 'context':  return global.appContext
    }
}

async function getDocs( parameter )
{
    return await data.docs.read( "docs/" + parameter )
    .then( (docContent) => {
        return docContent
    })
}

function infoRequest( request, parameter )
{
    var sendContent
    switch( request ) {
    case 'user': 
        sendContent = getUser( parameter )
        break;
    case 'docs':
        sendContent = getDocs( parameter )
        break;
    }
    return sendContent
}

module.exports = {
    infoRequest: infoRequest
}
