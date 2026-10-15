FROM node:20.19.1-alpine3.21

ENV NODE_ENV=production
WORKDIR /app

COPY . .

EXPOSE 8080

# Serve the static site with Node's built-in HTTP module. Tests can be run by
# overriding the command, for example: docker run --rm base64-tool npm test --offline
CMD ["node", "-e", "const http=require('node:http'),fs=require('node:fs'),path=require('node:path');const root=process.cwd();const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};http.createServer((req,res)=>{const url=new URL(req.url||'/', 'http://localhost');const relative=url.pathname==='/'?'/index.html':url.pathname;const file=path.resolve(root,'.'+relative);if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return}fs.readFile(file,(error,data)=>{if(error){res.writeHead(error.code==='ENOENT'?404:500);res.end(error.code==='ENOENT'?'Not found':'Server error');return}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data)});}).listen(Number(process.env.PORT)||8080,'0.0.0.0');"]
