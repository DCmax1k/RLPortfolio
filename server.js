const express = require('express');
const app = express();
const fs = require('fs');

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
app.get('/', logger, (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
});

app.get('/vid/:vid', (req, res) => {
    res.sendFile(__dirname + '/client/video.html');
});

// app.get('/video/:vid', (req, res) => {
//     if (req.hostname === 'localhost') {
//         res.sendFile(__dirname + '/client/videos/optimized/' + req.params.vid);
//     } else {
//         //console.log('Getting vid from disk')
//         res.sendFile('/mnt/hdd/videos/optimized/' + req.params.vid);
//     }
// });

app.get("/video/:vid", function (req, res) {
    if (req.hostname === 'localhost') {
        res.sendFile(__dirname + '/client/videos/optimized/' + req.params.vid);
    } else {
        //console.log('Getting vid from disk')
        res.sendFile('/mnt/hdd/videos/optimized/' + req.params.vid);
    }

    // let videoPath;
    // if (req.hostname === 'localhost') {
    //     videoPath = __dirname + '/client/videos/optimized/' + req.params.vid;
    // } else {
    //     videoPath = '/mnt/hdd/videos/optimized/' + req.params.vid;
    // }
    // // Ensure there is a range given for the video
    // let range = req.headers.range;
    // if (!range) {
    //   res.status(400).send("Requires Range header");
    // }
   
    // // get video stats (about 100MB)
    // const videoSize = fs.statSync(videoPath).size;
   
    // // Parse Range
    // // Example: "bytes=32324-"
    // const CHUNK_SIZE = 10 ** 6; // 1MB
    // const start = Number(range.replace(/\D/g, ""));
    // const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
   
    // // Create headers
    // const contentLength = end - start + 1;
    // const headers = {
    //   "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    //   "Accept-Ranges": "bytes",
    //   "Content-Length": contentLength,
    //   "Content-Type": "video/mp4",
    // };
   
    // // HTTP Status 206 for Partial Content
    // res.writeHead(206, headers);
   
    // // create video read stream for this particular chunk
    // const videoStream = fs.createReadStream(videoPath, { start, end });
   
    // // Stream the video chunk to the client
    // videoStream.pipe(res);
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