﻿﻿namespace RulonFlow.Api.DTOs.Auth;

public record LoginResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User);

public record UserDto(
    Guid Uuid,
    string Login,
    string FullName,
    IEnumerable<string> Roles,
    IEnumerable<string> Permissions);