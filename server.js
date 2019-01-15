var libServer = require('./lib.server')
var fs = require('fs-extra')
var path = require('path')
var express = require('express')

libServer((app)=>{
    app.use(express.static('public'))
})

