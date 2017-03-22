require('log-timestamp');
var  http = require('http'),
  redis = require('redis'),
  underscore = require('underscore'),
  crypto = require('crypto'),
  redisClient = redis.createClient();

var modifyResponseHeaders, modifyRequestHeader, server, proxyHost, port, cacheEntryTTLinSeconds, runningRequests;

proxyHost = "TODO.FILL.YOUR.HOST.HERE.COM";
port = 80;
cacheEntryTTLinSeconds = 60 * 60 * 24 * 7 * 4;
runningRequests = [];

server = http.createServer(function (req, res) {

    var path, requestHeaders, hashBase, md5, cacheKey;
    path = req.url;
    requestHeaders = underscore.clone(req.headers);
    //modifyRequestHeader(requestHeaders);

    console.log("Incoming Request: " + req.method + " " + path);
    console.dir(requestHeaders);

    hashBase = {
        method: req.method,
        path: path,
        accept: req.headers['accept']
    };

    md5 = crypto.createHash('md5');
    md5.update(JSON.stringify(hashBase));
    cacheKey  = md5.digest('hex');

    console.log('Hash: ' + cacheKey);

    var headers, statusCode, encoding, bodyChunks, bodyArrays;

    redisClient.hgetall(cacheKey, function (err, data) {
        function respond(write) {
            res.writeHead(statusCode, headers);
            var length = bodyChunks.length;
            if (length > 0) {
                for (var i = 0; i < length; ++i) {
                    write(i);
                }
            }
            res.end();
        }
        function respondFromCache() {
            var write = function (i) {
                var buffer = new Buffer(bodyChunks[i]);
                res.write(buffer, encoding);
            };
            respond(write);
            console.log("Responding from cache");
        }
        function requestFromDbpedia(forwardResponse) {
            var dbpediaRequestOptions = {
                hostname: "dbpedia.org",
                port: 80,
                path: path,
                headers: requestHeaders,
                //method: req.method
                method: "GET"
            };

            runningRequests.push(cacheKey);
            console.log("Requesting " + cacheKey + " from remote");

            http.get(dbpediaRequestOptions, function (dbpediaResponse) {
                function handleRemoteResponse() {
                    function respondFromRemote() {
                        var write = function(i)  {
                            res.write(bodyChunks[i], encoding);
                        };
                        respond(write);
                        console.log("Responding from remote");
                    }

                    function cacheResponse() {
                        if(statusCode >= 200 && statusCode <400)
                        {
                            var cacheObject = {
                                headers: JSON.stringify(headers),
                                statusCode: statusCode,
                                encoding: encoding,
                                bodyChunks: JSON.stringify(bodyArrays)
                            };
                            redisClient.hmset(cacheKey, cacheObject, function (err, reply) {
                                if (!err && reply == "OK") {
                                    console.log("Cached " + cacheKey);
                                    redisClient.expire(cacheKey, cacheEntryTTLinSeconds);
                                }
                                else {
                                    console.log("ERROR caching " + cacheKey);
                                }
                                var runningRequestIndex = runningRequests.indexOf(cacheKey);
                                if(runningRequestIndex >= 0) {
                                    runningRequests.splice(runningRequestIndex, 1);
                                    console.log("Update Request finished");
                                }
                            });
                        }
                        else{
                            console.log("Won't cache a " + statusCode + " response");
                        };
                    }

                    bodyChunks = [];
                    bodyArrays = [];

                    dbpediaResponse.on('data', function (chunk) {
                        bodyChunks.push(chunk);
                        bodyArrays.push(chunk.toJSON());
                    });

                    dbpediaResponse.on("end", function (event) {
                        headers = dbpediaResponse.headers;
                        //modifyResponseHeaders(headers);

                        statusCode = dbpediaResponse.statusCode;
                        encoding = (headers['content-encoding'] == 'utf8') ? 'utf-8' : 'binary';
                        if(forwardResponse) respondFromRemote();
                        cacheResponse();
                    });
                }

                handleRemoteResponse();
            });
        }


        if (!data) {
            console.log("Cache Miss " + cacheKey);

            requestFromDbpedia(true);
        } else {
            headers = JSON.parse(data.headers);
            statusCode = data.statusCode;
            encoding = data.encoding;
            bodyChunks = JSON.parse(data.bodyChunks);

            console.log("Cache Hit " + cacheKey);
            console.log(statusCode);
            console.dir(headers);

            //Update Cache only
            if(runningRequests.indexOf(cacheKey) < 0){
                console.log("Update Request started");
                requestFromDbpedia(false);
            }
            else {
                console.log("Update Request already running");
                console.dir(runningRequests);
            }
            respondFromCache();
        }
    });
});

console.log("Proxy running on port " + port)
server.listen(port);
