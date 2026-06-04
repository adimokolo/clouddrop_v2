# CloudDrop AWS Infrastructure Setup

## Required AWS Resources

### 1. S3 Bucket
```bash
aws s3api create-bucket \
  --bucket clouddrop-files-bucket \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket clouddrop-files-bucket \
  --versioning-configuration Status=Enabled

# Lifecycle rule: auto-expire temp files after 7 days
aws s3api put-bucket-lifecycle-configuration \
  --bucket clouddrop-files-bucket \
  --lifecycle-configuration file://s3-lifecycle.json
```

### 2. RDS PostgreSQL
```bash
aws rds create-db-instance \
  --db-instance-identifier clouddrop-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username clouddrop_admin \
  --master-user-password <SECURE_PASSWORD> \
  --allocated-storage 20 \
  --db-name clouddrop \
  --vpc-security-group-ids <SG_ID> \
  --db-subnet-group-name <SUBNET_GROUP> \
  --backup-retention-period 7 \
  --storage-encrypted \
  --no-publicly-accessible
```

### 3. EC2 Instance
```bash
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.small \
  --key-name clouddrop-key \
  --security-group-ids <SG_ID> \
  --subnet-id <SUBNET_ID> \
  --iam-instance-profile Name=clouddrop-ec2-role \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=clouddrop-app}]' \
  --user-data file://ec2-setup.sh
```

### 4. IAM Role for EC2
Policy to attach to EC2 instance role:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::clouddrop-files-bucket", "arn:aws:s3:::clouddrop-files-bucket/*"]
    },
    {
      "Effect": "Allow",
      "Action": ["ecr:GetAuthorizationToken", "ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

### 5. Security Groups

**EC2 Security Group (clouddrop-ec2-sg)**:
| Type | Port | Source |
|------|------|--------|
| SSH | 22 | Your IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |
| Custom | 5000 | 0.0.0.0/0 |

**RDS Security Group (clouddrop-rds-sg)**:
| Type | Port | Source |
|------|------|--------|
| PostgreSQL | 5432 | EC2 SG ID |

## GitHub Secrets Required
```
AWS_ACCESS_KEY_ID       → IAM user access key
AWS_SECRET_ACCESS_KEY   → IAM user secret key
EC2_HOST                → EC2 public IP or DNS
EC2_USER                → ubuntu
EC2_SSH_KEY             → Private key PEM content
ECR_REGISTRY            → <account>.dkr.ecr.us-east-1.amazonaws.com
API_URL                 → http://<ec2-ip>:5000
```
