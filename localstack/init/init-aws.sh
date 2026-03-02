#!/bin/bash
echo "Initializing LocalStack resources..."

# Create S3 bucket for user avatars
awslocal s3 mb s3://cinema-user-avatars
awslocal s3api put-bucket-cors --bucket cinema-user-avatars --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"]
    }
  ]
}'

# Create DynamoDB table for user sessions
awslocal dynamodb create-table \
  --table-name cinema-sessions \
  --attribute-definitions AttributeName=sessionId,AttributeType=S \
  --key-schema AttributeName=sessionId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Create SQS queue for event processing
awslocal sqs create-queue --queue-name cinema-events

# Create SNS topic for notifications
awslocal sns create-topic --name cinema-notifications

echo "LocalStack initialization complete!"
