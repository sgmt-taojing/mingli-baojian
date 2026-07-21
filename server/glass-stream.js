// 智能眼镜 SSE 流模块
const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no'
};
function streamChunks(res, chunks, intervalMs = 200){
  res.writeHead(200, SSE_HEADERS);
  let i = 0;
  const t = setInterval(()=>{
    if (i >= chunks.length){ res.write('event: end\ndata: {}\n\n'); clearInterval(t); return res.end(); }
    res.write(`data: ${JSON.stringify({chunk: chunks[i], index: i})}\n\n`);
    i++;
  }, intervalMs);
  reqClose(res, t);
}
function reqClose(res, timer){
  res.req && res.req.on('close', ()=>clearInterval(timer));
}
module.exports = { streamChunks, SSE_HEADERS };
