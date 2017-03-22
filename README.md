# dbpediaproxy

You have developed a nice prototype which uses DBpedia resources and right before your deadline or presentation DBPedia is down? Well, you're not alone. This has happened to most researchers in that area. (On a side node, check https://www.youtube.com/watch?v=K8_IucR0l7Q)

After some frustrating experiences, we wrote this little transparent DBpedia proxy. It will forward all HTTP GET requests to DBPedia and the responses back to you. Additionally, the responses are cached in redis. Therefore, even if DBPedia is temporarily unavailable, any HTTP resource which you have previously requested will be served from the cache. So next time you plan to run a demo for a conference or project meeting, just configure the dbpediaproxy and run the demo some time in advance so that all required resources are in the cache and then present demo without fear of a sudden downtime of DBpedia.

## Requirements
* node.js
* redis

## Setup

1. Setup *node.js* and *redis*
2. In *proxy.js*, set `proxyHost` to the hostname of the host on which you are running dbpediaproxy
3. In *proxy.js*, modify `cacheEntryTTLinSeconds` as required
4. Install the dependencies listed in *package.json* using *npm*
5. Run the proxy using `node proxy.js >> dbpediaproxy.log`
6. (Optional: Set up dbpediaproxy as service using the *dbpediaproxy.conf* provided)
7. On your clients, add an entry to your *hosts* file for dbpedia.org which points to the IP of the host on which you are running dbpediaproxy

## Contact

**Author**: Sebastian Heil (sebastian.heil@informatik.tu-chemnitz.de)

## License

MIT License

Copyright (c) 2017 Sebastian Heil

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
