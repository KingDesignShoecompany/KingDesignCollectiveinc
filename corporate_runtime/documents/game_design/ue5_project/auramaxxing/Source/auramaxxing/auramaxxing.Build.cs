// Copyright Epic Games, Inc. All Rights Reserved.

using UnrealBuildTool;

public class auramaxxing : ModuleRules
{
	public auramaxxing(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(new string[] {
			"Core", "CoreUObject", "Engine", "InputCore", "EnhancedInput",
			"JsonUtilities", "Json", "AuraClient"
		});

		PrivateDependencyModuleNames.AddRange(new string[] { });
	}
}
