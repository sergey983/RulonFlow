namespace RulonFlow.Api.DTOs.Auth;

public record LoginRequestDto(
    string Login,
    string Password,
    string? DeviceHardwareId);