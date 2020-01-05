import 'dotenv/config';
import http from 'http';
import crypto from 'crypto';
import { exec } from 'child_process';

// const USER_PATH = '/home/matan';

const GITHUB_TO_DIR = {
  'MatanMaimon/ResToRent': [
    `/var/www/restorent.co.il`,
  ],
};

http
  .createServer((req, res) => {
    req.on('data', chunk => {
      const signature = `sha1=${crypto
        .createHmac('sha1', process.env.SECRET)
        .update(chunk)
        .digest('hex')}`;

      const isAllowed = req.headers['x-hub-signature'] === signature;

      const body = JSON.parse(chunk);

      const isMaster = body?.ref === 'refs/heads/master';
      const directory = GITHUB_TO_DIR[body?.repository?.full_name];

      if (isAllowed && isMaster && directory && directory.length) {
        try {
          directory.forEach(entry => exec(`cd ${entry} && bash webhook.sh`));
          console.log(directory);
        } catch (error) {
          console.log(error);
        }
      }
    });
    res.write('DONE!');
    res.write(req);
    res.end();
  })
  .listen(8073);
