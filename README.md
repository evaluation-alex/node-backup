node-backup
===========

Simple node.js script to backup files and folders from a computer to an S3 bucket at regular intervals.

A list of files and folders are specified in the configuration. When backing up a specified file it will be compressed and uploaded as a gzip archive. When backing up a folder it will tar and then gzip the folder and upload the resulting archive.

The backup files are uploaded to the specified bucket in a folder hierarchy consisting of a root with the computer hostname and then a subfolder named as an ISO 8601 string representation of the current date/time.

Right now the script is set up to use Winser to install it as a windows service automatically during installation via `npm`. This should not affect its use on other platforms, but it is not currently set up to automatically create a daemon on any other platform.

Configuration
-------------

All configuration settings are in the `config.js` file and will need to be set to your needs.

Bucket Configuration
--------------------

You may worry about the possibility of someone accessing sensitive S3 credentials in the configuration file. You can configure a bucket policy for a discreet backup user that will allow them to write backups to S3 but not list or download any previous backup data.

```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "s3:GetBucketAcl",
        "s3:GetObjectAcl",
        "s3:PutObject"
      ],
      "Sid": "Stmt1373697306000",
      "Resource": [
        "arn:aws:s3:::bucket_name_here/*",
        "arn:aws:s3:::bucket_name_here"
      ],
      "Effect": "Allow"
    }
  ]
}
````

ToDo
----

- [ ] Handle paths with spaces
- [ ] Install automatic daemon on other OSs
