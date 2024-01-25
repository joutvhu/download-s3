import * as aws from 'aws-sdk';
import * as core from '@actions/core';
import {getInputs, S3Inputs} from './io-helper';
import {ListObjectsV2Output, ObjectList, StartAfter} from 'aws-sdk/clients/s3';
import * as fs from 'fs';
import {Readable} from 'stream';

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
        if (content?.Key != null) {
          const object = await s3.getObject({
            Bucket: inputs.awsBucket,
            Key: content.Key
          }).promise();

          if (typeof object.Body === 'string' || object.Body instanceof Uint8Array || object.Body instanceof Buffer) {
            fs.writeFileSync('downloadedFile.txt', object.Body);
          } else if (object.Body instanceof Blob) {
            fs.createWriteStream('downloadedFile.txt').write(object.Body);
          } else if (object.Body instanceof Readable) {
            fs.createWriteStream('downloadedFile.txt').write(object.Body);
          }
        }
      }

      if (objects.MaxKeys != null &&
        objects.MaxKeys === objects.KeyCount &&
        objects.KeyCount === contents.length &&
        contents.length > 0) {
        startAfter = contents[contents.length - 1].Key;
      }
    } while (startAfter != null);
  } catch (err: any) {
    core.debug(`Error status: ${err.status}`);
    core.setFailed(err.message);
  }
})();
