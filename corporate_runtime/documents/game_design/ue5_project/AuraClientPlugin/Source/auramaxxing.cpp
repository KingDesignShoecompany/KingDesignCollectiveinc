// Copyright Epic Games, Inc. All Rights Reserved.

#include "auramaxxing.h"
#include "Modules/ModuleManager.h"

// Pull in the Aura client module so its battle/NFC/Trinity functionality is
// linked and available to Blueprints/actors in this project.
#include "AuraClient.h"

DEFINE_LOG_CATEGORY_STATIC(LogAuramaxxing, Log, All);

void FauramaxxingModule::StartupModule()
{
	UE_LOG(LogAuramaxxing, Log, TEXT("auramaxxing module started; AuraClient available: %s"),
		FModuleManager::Get().IsModuleLoaded(TEXT("AuraClient")) ? TEXT("yes") : TEXT("no"));
}

void FauramaxxingModule::ShutdownModule()
{
	UE_LOG(LogAuramaxxing, Log, TEXT("auramaxxing module shut down"));
}

IMPLEMENT_PRIMARY_GAME_MODULE(FDefaultGameModuleImpl, auramaxxing, "auramaxxing");
