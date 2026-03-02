import AWS from 'aws-sdk';

// Configure AWS SDK to use LocalStack
const localStackConfig = {
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'fake',
    secretAccessKey: 'fake'
  },
  s3ForcePathStyle: true, // Required for S3 with LocalStack
};

// S3 Client for avatar uploads
export const s3Client = new AWS.S3(localStackConfig);

// DynamoDB Client for session management
export const dynamoDBClient = new AWS.DynamoDB.DocumentClient(localStackConfig);

// SQS Client for event processing
export const sqsClient = new AWS.SQS({
  ...localStackConfig,
  endpoint: 'http://localhost:4566/000000000000/cinema-events',
});

// Upload user avatar to S3
export const uploadAvatar = async (userId, file) => {
  const params = {
    Bucket: 'cinema-user-avatars',
    Key: `avatars/${userId}/${Date.now()}-${file.name}`,
    Body: file,
    ContentType: file.type,
    ACL: 'public-read',
  };

  try {
    const result = await s3Client.upload(params).promise();
    return { success: true, url: result.Location };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return { success: false, error: error.message };
  }
};

// Store user session in DynamoDB
export const storeSession = async (userId, sessionData) => {
  const params = {
    TableName: 'cinema-sessions',
    Item: {
      sessionId: `session_${Date.now()}`,
      userId,
      ...sessionData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    },
  };

  try {
    await dynamoDBClient.put(params).promise();
    return { success: true };
  } catch (error) {
    console.error('Error storing session:', error);
    return { success: false, error: error.message };
  }
};

// Send event to SQS
export const sendEvent = async (eventType, data) => {
  const params = {
    QueueUrl: 'http://localhost:4566/000000000000/cinema-events',
    MessageBody: JSON.stringify({
      eventType,
      data,
      timestamp: new Date().toISOString(),
    }),
  };

  try {
    await sqsClient.sendMessage(params).promise();
    return { success: true };
  } catch (error) {
    console.error('Error sending event:', error);
    return { success: false, error: error.message };
  }
};