using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using RulonFlow.Api.Auth;
using RulonFlow.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        //camelCase для согласованности с frontend
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddRulonFlowInfrastructure(builder.Configuration);
builder.Services.AddRulonFlowApplication();

var jwtKey = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Не задан Jwt:Secret");

var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = !string.IsNullOrWhiteSpace(jwtIssuer),
            ValidIssuer = jwtIssuer,

            ValidateAudience = !string.IsNullOrWhiteSpace(jwtAudience),
            ValidAudience = jwtAudience,

            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)),

            NameClaimType = "sub",
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization(options =>
{
    // ---- Ролевые политики (сохраняем для совместимости) ----

    // Администратор — полный доступ
    options.AddPolicy("Admin", policy =>
        policy.RequireRole("Администратор"));

    // Начальник склада — управление складом + администрирование
    options.AddPolicy("WarehouseManager", policy =>
        policy.RequireRole("Администратор", "Начальник склада"));

    // Кладовщик — базовый доступ к складским операциям
    options.AddPolicy("WarehouseKeeper", policy =>
        policy.RequireRole("Администратор", "Начальник склада", "Кладовщик"));

    // Просмотр справочников
    options.AddPolicy("ReadOnly", policy =>
        policy.RequireRole("Администратор", "Начальник склада", "Кладовщик"));

    // ---- Permission-политики ----

    options.AddPolicy("warehouse:view",   policy => policy.Requirements.Add(new PermissionRequirement("warehouse:view")));
    options.AddPolicy("warehouse:manage", policy => policy.Requirements.Add(new PermissionRequirement("warehouse:manage")));
    options.AddPolicy("pallets:view",     policy => policy.Requirements.Add(new PermissionRequirement("pallets:view")));
    options.AddPolicy("pallets:create",   policy => policy.Requirements.Add(new PermissionRequirement("pallets:create")));
    options.AddPolicy("pallets:move",     policy => policy.Requirements.Add(new PermissionRequirement("pallets:move")));
    options.AddPolicy("reports:view",     policy => policy.Requirements.Add(new PermissionRequirement("reports:view")));
    options.AddPolicy("users:view",       policy => policy.Requirements.Add(new PermissionRequirement("users:view")));
    options.AddPolicy("users:manage",     policy => policy.Requirements.Add(new PermissionRequirement("users:manage")));
    options.AddPolicy("roles:manage",     policy => policy.Requirements.Add(new PermissionRequirement("roles:manage")));
    options.AddPolicy("settings:manage",  policy => policy.Requirements.Add(new PermissionRequirement("settings:manage")));
});

// Register the PermissionAuthorizationHandler
builder.Services.AddAuthorization();
builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();