using Amazon.S3;
using Amazon.DynamoDBv2;
using Amazon.SQS;

namespace AuthApi.Services;

public interface IAWSService
{
    Task<string> GenerateAvatarUploadUrlAsync(string userId, string fileName);
    Task StoreUserSessionAsync(Guid userId, string token);
    Task SendNotificationAsync(string userId, string message);
}

public class AWSService : IAWSService
{
    private readonly IAmazonS3 _s3Client;
    private readonly IAmazonDynamoDB _dynamoDbClient;
    private readonly IAmazonSQS _sqsClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AWSService> _logger;

    public AWSService(
        IConfiguration configuration,
        ILogger<AWSService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        
        // Configure for LocalStack
        var config = new AmazonS3Config
        {
            ServiceURL = "http://localhost:4566",
            ForcePathStyle = true,
            UseHttp = true
        };
        
        var credentials = new Amazon.Runtime.BasicAWSCredentials("fake", "fake");
        
        _s3Client = new AmazonS3Client(credentials, config);
        _dynamoDbClient = new AmazonDynamoDBClient(credentials, new AmazonDynamoDBConfig
        {
            ServiceURL = "http://localhost:4566"
        });
        _sqsClient = new AmazonSQSClient(credentials, new AmazonSQSConfig
        {
            ServiceURL = "http://localhost:4566"
        });
    }

    public async Task<string> GenerateAvatarUploadUrlAsync(string userId, string fileName)
    {
        try
        {
            var request = new Amazon.S3.Model.GetPreSignedUrlRequest
            {
                BucketName = "cinema-user-avatars",
                Key = $"avatars/{userId}/{fileName}",
                Verb = HttpVerb.PUT,
                Expires = DateTime.UtcNow.AddMinutes(5),
                ContentType = "image/*"
            };

            var url = _s3Client.GetPreSignedURL(request);
            return url;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating pre-signed URL");
            throw;
        }
    }

    public async Task StoreUserSessionAsync(Guid userId, string token)
    {
        try
        {
            var request = new Amazon.DynamoDBv2.Model.PutItemRequest
            {
                TableName = "cinema-sessions",
                Item = new Dictionary<string, Amazon.DynamoDBv2.Model.AttributeValue>
                {
                    ["sessionId"] = new() { S = $"session_{Guid.NewGuid()}" },
                    ["userId"] = new() { S = userId.ToString() },
                    ["token"] = new() { S = token },
                    ["createdAt"] = new() { S = DateTime.UtcNow.ToString("o") },
                    ["expiresAt"] = new() { S = DateTime.UtcNow.AddDays(7).ToString("o") }
                }
            };

            await _dynamoDbClient.PutItemAsync(request);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error storing session in DynamoDB");
        }
    }

    public async Task SendNotificationAsync(string userId, string message)
    {
        try
        {
            var queueUrlResponse = await _sqsClient.GetQueueUrlAsync("cinema-events");
            
            var request = new Amazon.SQS.Model.SendMessageRequest
            {
                QueueUrl = queueUrlResponse.QueueUrl,
                MessageBody = System.Text.Json.JsonSerializer.Serialize(new
                {
                    userId,
                    message,
                    timestamp = DateTime.UtcNow
                })
            };

            await _sqsClient.SendMessageAsync(request);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending SQS message");
        }
    }
}