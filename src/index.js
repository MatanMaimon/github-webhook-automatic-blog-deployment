import 'dotenv/config';
import crypto from 'crypto';
import { exec } from 'child_process';
import express from 'express';
import bodyParser from 'body-parser';


const app = express();


const GITHUB_TO_DIR = {
  'MatanMaimon/ResToRent__server': [{
    destDir: `~/gitRepos/ResToRent`,
    isServerSide: true,
    appName: 'app'
  }],
  'MatanMaimon/ResToRent__client': [{
    destDir:`/var/www/ResToRent`,
    isClientSide: true
  }],
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
      // the webhook.sh dir
      const webHookPath = __dirname;

      // execute for each `directory` item
      directory.forEach(entry => {

        
        // first, pull
        output += `pulling "master" branch to ${entry.destDir}...\n`;
        exec(`cd ${entry.destDir} && git pull --rebase origin master`);

        // check if need to `npm install` (if package.json was modified)
        if (req.body?.commits?.filter(commit => commit.modified?.indexOf('package.json')).length > 0) {
          output += `npm install is need to be done ("package.json") was modified\n`;
          exec(`cd ${entry.destDir} && npm install`);
        }

        // if the repo is server side (nodejs), restart the app
        if (entry.isServerSide) {
          output += `this repo is server side, restart pm2 for the app "${entry.appName}"\n`;
          exec(`pm2 stop ${entry.appName}`);
          exec(`pm2 restart ${entry.appName}`);
        }

        
        //exec(`cd ${entry} && bash ${webHookPath}/../webhook.sh`)
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
