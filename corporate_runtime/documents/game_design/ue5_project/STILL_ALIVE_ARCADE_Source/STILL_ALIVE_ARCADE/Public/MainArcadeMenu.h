#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "MainArcadeMenu.generated.h"

UCLASS()
class STILLALIVEARCADE_API UMainArcadeMenu : public UUserWidget
{
    GENERATED_BODY()

protected:
    UFUNCTION()
    void OnStartClicked();

    UFUNCTION()
    void OnExitClicked();
};
