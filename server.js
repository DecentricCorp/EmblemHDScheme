var libServer = require('./lib.server')
var fs = require('fs-extra')
var path = require('path')
var express = require('express')
var os = require('os')

libServer({
    mySubscribeKey: "sub-c-95c943a2-5962-11e4-9632-02ee2ddab7fe",
    myPublishKey: "pub-c-a281bc74-72b6-4976-88ec-e039492b0dfa",
    myChannel: "dat_archival",
    deleteAfterImport: true
},
    (app, csp) => {
        console.log("Open your browser to http://127.0.0.1:3000")
        app.get('/create', csp, (req, res)=>{
            var CreateEmblem = require('./create')
            CreateEmblem({request: req}).then(payload=>{
                res.send(JSON.parse(payload.body))
            })    
        })
        app.listen(3000)
    })





