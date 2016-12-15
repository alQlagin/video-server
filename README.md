# Video server
NodeJs server for streaming video from path

## Install
```bash
npm install video-server
```

## Usage
Video server exports express app

```javascript
let app = require('video-server');
app.listen(app.get('PORT'));
```

All videos stored at internal directory by default (storage root)

## Api
### ```POST /upload```

Is multipart request. Body must contain `video` parameter with file.
 
It also can contain `category` parameter. In storage root will be created subdirectory when `category` presented  

Returns json object with `id` property. Id is a relative path to file from storage root

### ```GET /view/:id```

renders sample view with html5 video object

### ```GET /stream/:id```

send partial content video streaming


## Options

### PORT
To change port run
```app.set('PORT', 80)```

Default is 8000

### STORAGE DIR

To change directory where videos are stored  
```app.set('STORAGE_DIR', '/path/to/your/directory/')```

