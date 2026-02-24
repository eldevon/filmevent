// namespace AuthApi.Tests;

// public class UnitTest1
// {
//     [Fact]
//     public void Test1()
//     {

//     }
// }

using AuthApi.Data;
using AuthApi.Models;
using AuthApi.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AuthApi.Tests.UnitTests;

public class AuthServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly AuthService _authService;
    private readonly Mock<ILogger<AuthService>> _loggerMock;

    public AuthServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new ApplicationDbContext(options);
        _loggerMock = new Mock<ILogger<AuthService>>();
        
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string>
            {
                {"Jwt:Key", "test-key-with-at-least-32-characters-for-testing!"},
                {"Jwt:Issuer", "test"},
                {"Jwt:Audience", "test"}
            })
            .Build();

        _authService = new AuthService(_context, configuration, _loggerMock.Object);
    }

    [Fact]
    public async Task RegisterAsync_ValidRequest_ReturnsAuthResponse()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john@example.com",
            Password = "password123"
        };

        // Act
        var result = await _authService.RegisterAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.Token);
        Assert.Equal(request.FirstName, result.User.FirstName);
        Assert.Equal(request.LastName, result.User.LastName);
        Assert.Equal(request.Email, result.User.Email);
    }

    [Fact]
    public async Task RegisterAsync_DuplicateEmail_ThrowsException()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "duplicate@example.com",
            Password = "password123"
        };

        await _authService.RegisterAsync(request);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _authService.RegisterAsync(request));
    }

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsAuthResponse()
    {
        // Arrange
        var registerRequest = new RegisterRequest
        {
            FirstName = "Jane",
            LastName = "Smith",
            Email = "jane@example.com",
            Password = "password123"
        };

        await _authService.RegisterAsync(registerRequest);

        var loginRequest = new LoginRequest
        {
            Email = "jane@example.com",
            Password = "password123"
        };

        // Act
        var result = await _authService.LoginAsync(loginRequest);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.Token);
        Assert.Equal("Jane", result.User.FirstName);
    }

    [Fact]
    public async Task LoginAsync_InvalidPassword_ThrowsException()
    {
        // Arrange
        var registerRequest = new RegisterRequest
        {
            FirstName = "Bob",
            LastName = "Johnson",
            Email = "bob@example.com",
            Password = "correctpassword"
        };

        await _authService.RegisterAsync(registerRequest);

        var loginRequest = new LoginRequest
        {
            Email = "bob@example.com",
            Password = "wrongpassword"
        };

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authService.LoginAsync(loginRequest));
    }
}
