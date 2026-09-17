// Copyright Epic Games, Inc. All Rights Reserved.

using UnrealBuildTool;

public class auramaxxingEditorTarget : TargetRules
{
	public auramaxxingEditorTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Editor;
		DefaultBuildSettings = BuildSettingsVersion.V6;
		IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_7;
		ExtraModuleNames.Add("auramaxxing");
	}
}
