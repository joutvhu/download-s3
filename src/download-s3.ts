import * as aws from 'aws-sdk';
import * as core from '@actions/core';
import {getInputs, S3Inputs} from './io-helper';
import {Body, ListObjectsV2Output, ObjectList, StartAfter} from 'aws-sdk/clients/s3';
import * as fs from 'fs';
import {Readable} from 'stream';

function checkKey(key?: string, prefix?: string): boolean {
  if (key != null) {
    if (prefix == null || prefix.length === 0)
      return true;
    if (prefix.endsWith('/'))
      return true;
    if (prefix === key)
      return true;
    if (key.startsWith(prefix + '/'))
      return true;
  }
  return false;
}

function saveFile(path: string, body?: Body) {
  if (typeof body === 'string' || body instanceof Uint8Array || body instanceof Buffer) {
    fs.writeFileSync(path, body);
  } else if (body instanceof Blob) {
    fs.createWriteStream(path).write(body);
  } else if (body instanceof Readable) {
    fs.createWriteStream(path).write(body);
  }
}

(async function run() {
  try {
    const inputs: S3Inputs = getInputs();

    aws.config.update({
      credentials: {
        accessKeyId: inputs.awsAccessKeyId,
        secretAccessKey: inputs.awsSecretAccessKey,
      },
      region: inputs.awsRegion
    });
    const s3 = new aws.S3({signatureVersion: 'v4'});

    let startAfter: StartAfter | undefined = undefined;
    let objects: ListObjectsV2Output | undefined;
    do {
      objects = await s3.listObjectsV2({
        Bucket: inputs.awsBucket,
        Prefix: inputs.source,
        StartAfter: startAfter
      }).promise();
      const contents: ObjectList = objects.Contents ?? [];

      for (const content of contents) {
        if (checkKey(content?.Key, inputs.source)) {
          const object = await s3.getObject({
            Bucket: inputs.awsBucket,
            Key: content.Key!
          }).promise();


          saveFile('', object.Body);
        }
      }

      if (objects.MaxKeys != null &&
        objects.MaxKeys === objects.KeyCount &&
        objects.KeyCount === contents.length &&
        contents.length > 0) {
        startAfter = objects.Contents?.at(-1)?.Key;
      }
    } while (startAfter != null);
  } catch (err: any) {
    core.debug(`Error status: ${err.status}`);
    core.setFailed(err.message);
  }
})();
