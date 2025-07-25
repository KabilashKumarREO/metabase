---
title: Amazon Athena
---

# Amazon Athena

To add a database connection, click on the **gear** icon in the top right, and navigate to **Admin settings** > **Databases** > **Add a database**.

## Connection and sync

After connecting to a database, you'll see the "Connection and sync" section that displays the current connection status and options to manage your database connection.

Here you can [sync the database schema and rescan field values](../sync-scan.md), and edit connection details.

### Edit connection details

You can edit these settings at any time (and remember to save your changes).

### Display name

The display name for the database in the Metabase interface.

### Region

The AWS region where your database is hosted, for Amazon Athena. For example, you might enter `us-east-1`.

### Workgroup

AWS workgroup. For example: `primary`. See [documentation on workgroups](https://docs.aws.amazon.com/athena/latest/ug/user-created-workgroups.html).

### S3 Staging directory

This S3 staging directory must be in the same region you specify above.

### Access key

Part of IAM credentials for AWS. Metabase will encrypt these credentials.

If you're running Metabase on AWS and want to use [AWS Default Credentials Chain](https://docs.aws.amazon.com/sdk-for-java/v1/developer-guide/credentials.html#credentials-default), leave the Access and Secret keys blank.

See also our [notes on connecting to Athena](#notes-on-connecting-to-athena).

### Secret Key

Part of IAM credentials for AWS. Metabase will encrypt these credentials.

### Additional Athena connection string options

You can specify additional options via a string, e.g., `UseResultsetStreaming=0;LogLevel=6`.

### Include User ID and query hash in queries

This can be useful for auditing and debugging, but prevents databases from caching results and may increase your costs. Enable this feature if you need to track which users are running specific queries.

### Re-run queries for simple explorations

Turn this option **OFF** if people want to click **Run** (the play button) before applying any [Summarize](../../questions/query-builder/summarizing-and-grouping.md) or filter selections.

By default, Metabase will execute a query as soon as you choose an grouping option from the **Summarize** menu or a filter condition from the [drill-through menu](https://www.metabase.com/learn/metabase-basics/querying-and-dashboards/questions/drill-through). If your database is slow, you may want to disable re-running to avoid loading data on each click.

### Choose when syncs and scans happen

See [syncs and scans](../sync-scan.md#choose-when-syncs-and-scans-happen).

### Periodically refingerprint tables

> Periodic refingerprinting will increase the load on your database.

Turn this option **ON** to scan a sample of values every time Metabase runs a [sync](../sync-scan.md#how-database-syncs-work).

A fingerprinting query examines the first 10,000 rows from each column and uses that data to guesstimate how many unique values each column has, what the minimum and maximum values are for numeric and timestamp columns, and so on. If you leave this option **OFF**, Metabase will only fingerprint your columns once during setup.

## Notes on connecting to Athena

If you use other AWS services, we recommend that you create a special AWS Service Account that only has the permissions required to run Athena, and input the IAM credentials from that account to connect Metabase to Athena.

See [Identity and access management in Athena](https://docs.aws.amazon.com/athena/latest/ug/security-iam-athena.html).

### Connecting using AWS Default Credentials Chain

If you're running Metabase on AWS and want to use [AWS Default Credentials Chain](https://docs.aws.amazon.com/sdk-for-java/v1/developer-guide/credentials.html#credentials-default), leave the Access and Secret keys blank.

- For EC2, you can use [instance profiles](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2_instance-profiles.html).
- For ECS, you can use [IAM roles for tasks](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)

In both cases, the Athena driver will automatically fetch session credentials based on which IAM role you've configured.

### Permissions and IAM Policies

Most issues that we see when people attempt to connect to AWS Athena involve permissions. Querying AWS Athena requires permissions to:

- AWS Athena.
- AWS Glue.
- The S3 bucket where Athena results are stored.
- The resources that Athena is querying against (i.e., the S3 bucket(s) Athena is querying).
- If you're using AWS Lake Formation, then you also need to grant AWS Lake Formation permissions through the AWS Console (AWS Lake Formation > Permissions > Data Lake Permissions > Grant data lake permissions; the role Metabase uses needs SELECT and DESCRIBE table permissions).

### Example IAM Policy

This policy provides read-only permissions for data in S3. You'll need to specify any S3 buckets that you want Metabase to be able to query from _as well as_ the S3 bucket provided as part of the configuration where results are written to.

There may be additional permissions required for other Athena functionality, like federated queries. For details, check out the [Athena docs](https://docs.aws.amazon.com/athena/latest/ug/security-iam-athena).

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Athena",
      "Effect": "Allow",
      "Action": [
        "athena:BatchGetNamedQuery",
        "athena:BatchGetQueryExecution",
        "athena:GetNamedQuery",
        "athena:GetQueryExecution",
        "athena:GetQueryResults",
        "athena:GetQueryResultsStream",
        "athena:GetWorkGroup",
        "athena:ListDatabases",
        "athena:ListDataCatalogs",
        "athena:ListNamedQueries",
        "athena:ListQueryExecutions",
        "athena:ListTagsForResource",
        "athena:ListWorkGroups",
        "athena:ListTableMetadata",
        "athena:StartQueryExecution",
        "athena:StopQueryExecution",
        "athena:CreatePreparedStatement",
        "athena:DeletePreparedStatement",
        "athena:GetPreparedStatement",
        "athena:GetTableMetadata"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Glue",
      "Effect": "Allow",
      "Action": [
        "glue:BatchGetPartition",
        "glue:GetDatabase",
        "glue:GetDatabases",
        "glue:GetPartition",
        "glue:GetPartitions",
        "glue:GetTable",
        "glue:GetTables",
        "glue:GetTableVersion",
        "glue:GetTableVersions"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3ReadAccess",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": [
        "arn:aws:s3:::bucket1",
        "arn:aws:s3:::bucket1/*",
        "arn:aws:s3:::bucket2",
        "arn:aws:s3:::bucket2/*"
      ]
    },
    {
      "Sid": "AthenaResultsBucket",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:AbortMultipartUpload",
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": ["arn:aws:s3:::bucket2", "arn:aws:s3:::bucket2/*"]
    }
  ]
}
```

If Metabase also needs to create tables, you'll need additional AWS Glue permissions. The `"Resource": "*"` key-value pair gives the account Delete and Update permissions to any table:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": [
        "glue:BatchCreatePartition",
        "glue:UpdateDatabase",
        "glue:DeleteDatabase",
        "glue:CreateTable",
        "glue:CreateDatabase",
        "glue:UpdateTable",
        "glue:BatchDeletePartition",
        "glue:BatchDeleteTable",
        "glue:DeleteTable",
        "glue:CreatePartition",
        "glue:DeletePartition",
        "glue:UpdatePartition",
        "glue:GetCatalogImportStatus"
      ],
      "Resource": "*"
    }
  ]
}
```

## Model features

There aren't (yet) any model features available for Athena.

## Danger zone

See [Danger Zone](../danger-zone.md).

## Further reading

- [Managing databases](../../databases/connecting.md)
- [Metadata editing](../../data-modeling/metadata-editing.md)
- [Models](../../data-modeling/models.md)
- [Setting data access permissions](../../permissions/data.md)
