var libServer = require('./lib.server')
var fs = require('fs-extra')
var path = require('path')
var express = require('express')
var os = require('os')
var LiveFeeds = {shards: []}
var WatchJS = require("melanke-watchjs")

function Feeds(liveFeeds){
    this.LiveFeeds = liveFeeds
}
Feeds.prototype.watch = function(prop,cb){
    return WatchJS.watch(this.LiveFeeds, prop, (__,_,item)=>{
        //saveArchivistFeed()
    })
}
var feeds = new Feeds(LiveFeeds)

libServer({read: readArchivistFlatFeed, save: saveArchivistFeed}, (app)=>{
        app.listen(3000)
        app.use(express.static('public'))
        readArchivistFlatFeed('open', (liveFeeds)=>{
            feeds.watch('shards', (id, oldval, newval)=>{
                console.log(id, oldval, newval)
            })
        })
        //saveArchivistFeed()
        
        /* if (feeds.LiveFeeds.shards.filter(shard=>{return shard === "ef76ad93444d8d8070933a1faf5df8999b7bceba6a23fd505b8ab6ed21fe62e7"}).length === 0){
            feeds.LiveFeeds.shards.push("ef76ad93444d8d8070933a1faf5df8999b7bceba6a23fd505b8ab6ed21fe62e7")
        } */
})

function readArchivistFlatFeed(type, cb){
    if (!cb) return readArchivistFlatFeed(type, ()=>{})
    
    var feedSrc = path.resolve(__dirname, 'feeds')
    var archivistFeed = fs.readFileSync(feedSrc).toString().split(os.EOL)
    archivistFeed.forEach((item, index)=>{
        if (!LiveFeeds.shards.includes(item)) LiveFeeds.shards.push(item)
        if (index+1 === archivistFeed.length) {
            return cb(LiveFeeds)
        }
    })
}

function saveArchivistFeed(type, feed, cb){
    if (!cb) return saveArchivistFeed(type, feed, ()=>{})
    var feedSrc = path.resolve(__dirname, 'feeds')
    var feedJsonSrc = path.resolve(__dirname, 'feeds.json')
    var feedData = []
    var filtered = feeds.LiveFeeds.shards.filter(shard=>{return shard === feed.key.toString('hex')})
    if (type === 'remove' && filtered.length === 1) {
        var tempFeed = feeds.LiveFeeds.shards.filter(shard=>{return shard !== feed.key.toString('hex')})
        feeds.LiveFeeds.shards = tempFeed
    }
    feeds.LiveFeeds.shards.forEach((shard, index)=>{
        if (!feedData.includes(shard)) feedData.push(shard)
        if (index+1 === feeds.LiveFeeds.shards.length) {
            fs.writeFileSync(feedJsonSrc, JSON.stringify(feeds.LiveFeeds, null, 4))
            var feedContent = fs.readFileSync(feedSrc).toString()
            var isSame = (feedContent === feedData.join(os.EOL))
            if (!isSame) {
                fs.writeFile(feedSrc, feedData.join(os.EOL), err=>{
                    return cb(feedData)
                })
            }
                
            //})            
        }
    })
}



