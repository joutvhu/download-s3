# Download S3

GitHub action to download files from Amazon S3

## Usage

See [action.yml](action.yml)

## Inputs

- `aws_access_key_id`: (__Required__) The AWS access key ID.
- `aws_secret_access_key`: (__Required__) The AWS secret access key.
- `aws_region`: (__Required__) The region to send service requests to.
- `aws_bucket`: (__Required__) The bucket name containing the files to download.
- `source`: The directory (or file path) on the bucket to which you want to download. Default is root directory.
- `target`: The local directory (or file path) where files are saved. Default is current directory.

## Example

```yaml
steps:
  - uses: joutvhu/download-s3@v1
    with:
      aws_access_key_id: ${{ secrets.AWS_ACCESS_KEY_ID }}
      aws_secret_access_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      aws_region: us-east-1
      aws_bucket: ${{ secrets.AWS_BUCKET }}
      source: ''
      target: './backup'
```
