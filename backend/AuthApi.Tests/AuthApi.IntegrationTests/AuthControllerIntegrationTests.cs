// namespace AuthApi.IntegrationTests;

// public class UnitTest1
// {
//     [Fact]
//     public void Test1()
//     {

//     }
// }

using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using AuthApi.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.VisualStudio.TestPlatform.TestHost;

namespace AuthApi.Tests.IntegrationTests;

public class AuthControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public AuthControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_Login_GetUser_FullFlow_Success()
    {
        // Step 1: Register a new user
        var registerRequest = new RegisterRequest
        {
            FirstName = "Integration",
            LastName = "Test",
            Email = $"test{DateTime.Now.Ticks}@example.com",
            Password = "Test123!"
        };

        var registerContent = new StringContent(
            JsonSerializer.Serialize(registerRequest),
            Encoding.UTF8,
            "application/json");

        var registerResponse = await _client.PostAsync("/api/auth/register", registerContent);
        
        Assert.Equal(HttpStatusCode.OK, registerResponse.StatusCode);
        
        var registerResponseContent = await registerResponse.Content.ReadAsStringAsync();
        var registerResult = JsonSerializer.Deserialize<AuthResponse>(
            registerResponseContent, 
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        Assert.NotNull(registerResult);
        Assert.NotNull(registerResult.Token);
        Assert.Equal(registerRequest.Email, registerResult.User.Email);

        // Step 2: Login with the registered user
        var loginRequest = new LoginRequest
        {
            Email = registerRequest.Email,
            Password = registerRequest.Password
        };

        var loginContent = new StringContent(
            JsonSerializer.Serialize(loginRequest),
            Encoding.UTF8,
            "application/json");

        var loginResponse = await _client.PostAsync("/api/auth/login", loginContent);
        
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        
        var loginResponseContent = await loginResponse.Content.ReadAsStringAsync();
        var loginResult = JsonSerializer.Deserialize<AuthResponse>(
            loginResponseContent,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        Assert.NotNull(loginResult);
        Assert.NotNull(loginResult.Token);
        Assert.Equal(registerRequest.Email, loginResult.User.Email);

        // Step 3: Get user details with token
        _client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", loginResult.Token);
        
        var userResponse = await _client.GetAsync("/api/auth/user");
        
        Assert.Equal(HttpStatusCode.OK, userResponse.StatusCode);
        
        var userResponseContent = await userResponse.Content.ReadAsStringAsync();
        var userResult = JsonSerializer.Deserialize<UserDto>(
            userResponseContent,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        Assert.NotNull(userResult);
        Assert.Equal(registerRequest.Email, userResult.Email);
        Assert.Equal(registerRequest.FirstName, userResult.FirstName);
        Assert.Equal(registerRequest.LastName, userResult.LastName);
    }

    [Fact]
    public async Task GetUserDetails_WithoutToken_ReturnsUnauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/auth/user");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
