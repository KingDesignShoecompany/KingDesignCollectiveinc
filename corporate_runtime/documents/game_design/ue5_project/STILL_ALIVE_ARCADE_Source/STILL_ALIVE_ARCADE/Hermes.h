// Fill out your copyright notice in the Description page of Project Settings.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "Hermes.generated.h"

UCLASS()
class STILL_ALIVE_ARCADE_API AHermes : public AActor
{
	GENERATED_BODY()
	
public:	
	// Sets default values for this actor's properties
	AHermes();

protected:
	// Called when the game starts or when spawned
	virtual void BeginPlay() override;

public:	
	// Called every frame
	virtual void Tick(float DeltaTime) override;

};
