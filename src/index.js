import 'dotenv/config';
import crypto from 'crypto';
import { exec, execSync } from 'child_process';
import express from 'express';
import bodyParser from 'body-parser';

const app = express();

const GITHUB_TO_DIR = {
  'MatanMaimon/ResToRent__server': [
    {
      destDir: `~/gitRepos/ResToRent__server`,
      isServerSide: true,
    },
  ],
  'MatanMaimon/ResToRent__client': [
    {
      destDir: `~/gitRepos/ResToRent__client`,
      needWebpackBuild: true,
    },
  ],
  'MatanMaimon/github-webhook-automatic-deployment': [
    {
      destDir: `~/gitRepos/github-webhook-automatic-deployment`,
      isServerSide: true,
    },
  ],
};

app.use(bodyParser.json());

app.post('/', (req, res) => {
  // output to the end
  let output = `Starting...\n`;

  const stringifyBody = JSON.stringify(req.body);

  // build the signature based on `SECRET` and body data
  const signature = `sha1=${crypto
    .createHmac('sha1', process.env.SECRET)
    .update(stringifyBody)
    .digest('hex')}`;

  const isAllowed = req.headers['x-hub-signature'] === signature;
  const isMaster = req.body?.ref === 'refs/heads/master';
  const directory = GITHUB_TO_DIR[req.body?.repository?.full_name];

  if (isAllowed && isMaster && directory && directory.length) {
    try {
      // execute for each `directory` item
      directory.forEach(entry => {
        // first, pull
        output += `pulling "master" branch to ${entry.destDir}...\n`;
        execSync(`cd ${entry.destDir} && git pull --rebase origin master`);

        // check if need to `npm install` (if package.json was modified)
        if (
          req.body?.commits?.filter(
            commit => commit.modified?.indexOf('package.json') >= 0
          ).length > 0
        ) {
          output += `"package.json" was modified. npm install (run "npm ci") is need to be done\n`;
          execSync(`cd ${entry.destDir} && npm ci`);
        }

        // if the repo is server side (nodejs), restart the app
        if (entry.isServerSide) {
          output += `this repo is server side, restart pm2 for the app (by run "pm2 start ecosystem.config.js")\n`;
          execSync(`cd ${entry.destDir} && pm2 start ecosystem.config.js`);
        }

        // if the repo is client side, build with webpack
        if (entry.needWebpackBuild) {
          output += `this repo is client side & build with webpack (will run "npm run build")\n`;
          execSync(`cd ${entry.destDir} && npm run build`);
        }
      });

      output += `DONE!`;
      console.log('success');
    } catch (error) {
      output += `ERROR!`;
      console.log(error);
    }
  }
  res.send(output);
});

app.listen(8073, () => console.log(`autoDeploy webhook is running!`));
