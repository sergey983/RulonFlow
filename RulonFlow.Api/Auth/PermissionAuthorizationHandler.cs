using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace RulonFlow.Api.Auth;

/// <summary>
/// Проверяет политики на основе permission-claims в JWT.
/// Например: [Authorize(Policy = "users:manage")] проверит наличие claim type="permission", value="users:manage"
/// </summary>
public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var hasPermission = context.User.Claims
            .Any(c => c.Type == "permission" && c.Value == requirement.Permission);

        if (hasPermission)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}

public class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }

    public PermissionRequirement(string permission)
    {
        Permission = permission;
    }
}
