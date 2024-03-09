const express = require('express');
const app = express();

const { SitemapStream, streamToPromise } = require('sitemap');
const { createGzip } = require('zlib');

const logger = (req, res, next) => {
    const date = new Date();
    const time = `[ ${date.getHours()}:${date.getMinutes()} ]`;
    res.on('finish', () => {
        console.log(time, req.method, req.url, res.statusCode);
        console.log('');
    });
    next();
}

app.use(express.static(__dirname + '/client'));

// Main route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
});

app.get('/vid/:vid', (req, res) => {
    res.sendFile(__dirname + '/client/video.html');
});

// Sitemap
let sitemap;
app.get('/sitemap.xml', async (req, res) => {
    res.header('Content-Type', 'application/xml');
    res.header('Content-Encoding', 'gzip');

    if (sitemap) {
        res.send(sitemap);
        return;
    }

    try {
      const smStream = new SitemapStream({ hostname: 'https://rocketleague.digitalcaldwell.com/' });
      const pipeline = smStream.pipe(createGzip());

      smStream.write({ url: '/'});
      //smStream.write({ url: '/agreements/termsofuse'});
      //smStream.write({ url: '/agreements/privacypolicy'});
      //smStream.write({ url: '/login'});
      //smStream.write({ url: '/signup'});

      // cache the response
      streamToPromise(pipeline).then(sm => sitemap = sm);
      
      smStream.end();

      // Show errors and response
      pipeline.pipe(res).on('error', (e) => {throw e});
    } catch (e) {
        console.log(e);
    }
});

app.listen(process.env.PORT || 3003, () => {
    console.log('Serving on port 3003...');
});