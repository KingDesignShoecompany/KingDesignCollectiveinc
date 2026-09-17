#include "MainArcadeMenu.h"
#include "Components/Button.h"

void UMainArcadeMenu::OnStartClicked()
{
    UE_LOG(LogTemp, Log, TEXT("START clicked"));
}

void UMainArcadeMenu::OnExitClicked()
{
    UE_LOG(LogTemp, Log, TEXT("EXIT clicked"));
}
