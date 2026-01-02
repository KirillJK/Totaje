import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

router.get('/', requireAuth, async (req: any, res) => {
  try {
    const videoFolder = process.env.VIDEO_FOLDER;

    if (!videoFolder) {
      return res.status(500).json({ error: 'Video folder not configured' });
    }

    if (!fs.existsSync(videoFolder)) {
      return res.status(404).json({ error: 'Video folder not found' });
    }

    const files = fs.readdirSync(videoFolder);

    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v'];
    const videoFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return videoExtensions.includes(ext);
      })
      .map(file => ({
        name: file,
        path: file,
      }));

    res.json(videoFiles);
  } catch (error: any) {
    console.error('Error reading video folder:', error);
    res.status(500).json({ error: 'Failed to read video folder' });
  }
});

router.get('/stream/:filename', requireAuth, (req: any, res) => {
  try {
    const videoFolder = process.env.VIDEO_FOLDER;
    const { filename } = req.params;

    if (!videoFolder) {
      return res.status(500).json({ error: 'Video folder not configured' });
    }

    const videoPath = path.join(videoFolder, filename);

    const normalizedPath = path.normalize(videoPath);
    if (!normalizedPath.startsWith(path.normalize(videoFolder))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error: any) {
    console.error('Error streaming video:', error);
    res.status(500).json({ error: 'Failed to stream video' });
  }
});

export default router;
