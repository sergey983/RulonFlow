using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RulonFlow.Api.Services;
using RulonFlow.Infrastructure.Persistence;

namespace RulonFlow.Api.Extensions;

public static class DependencyInjectionExtensions
{
    public static IServiceCollection AddRulonFlowInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("RulonFlow");

        services.AddDbContext<RulonFlowDbContext>(options =>
            options.UseMySql(
                connectionString,
                ServerVersion.AutoDetect(connectionString)));

        return services;
    }

    public static IServiceCollection AddRulonFlowApplication(
        this IServiceCollection services)
    {
        services.AddScoped<AuthService>();
        return services;
    }
}