/* gendocs.js
 * Copyright (c) 2019 by David Asher, https://github.com/david-asher
 *
 * generate a set of documentation
 */
'use strict';

const files = require( './modules/fileutils.js' )
const { execSync } = require('child_process')

const moduleFolder = "./lib/modules"
const docFolder = "./docs"
const docFiles = files.listFiles( moduleFolder )

docFiles.forEach( (fileName) => {
    console.log( "Doc: ", fileName )
    execSync( `jsdoc2md ${moduleFolder}/${fileName} > ${docFolder}/${fileName}.md` )
})
