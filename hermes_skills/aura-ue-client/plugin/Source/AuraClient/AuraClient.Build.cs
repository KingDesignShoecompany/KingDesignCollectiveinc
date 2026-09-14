// AuraClient.Build.cs
using UnrealBuildTool;

public class AuraClient : ModuleRules
{
    public AuraClient(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        PublicDependencyModuleNames.AddRange(new string[] {
            "Core", "CoreUObject", "Engine", "HTTP", "Json", "JsonUtilities"
        });
        PrivateDependencyModuleNames.AddRange(new string[] {
            "Projects"
        });
    }
}
